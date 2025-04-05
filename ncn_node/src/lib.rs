pub mod merkle_root_upload_workflow;
pub mod constants;
pub mod utils;
pub use utils::upload_merkle_root_ix;

use {
    serde::{de::DeserializeOwned, Deserialize, Serialize},
    solana_client::{
        nonblocking::rpc_client::RpcClient,
        rpc_client::{RpcClient as SyncRpcClient},
    },
    solana_merkle_tree::MerkleTree,
    solana_metrics::{datapoint_error, datapoint_warn},
    solana_program::{
        instruction::InstructionError,
        rent::{
            ACCOUNT_STORAGE_OVERHEAD, DEFAULT_EXEMPTION_THRESHOLD, DEFAULT_LAMPORTS_PER_BYTE_YEAR,
        },
    },
    solana_rpc_client_api::{
        client_error::{Error, ErrorKind},
        request::{RpcError, RpcResponseErrorData},
        response::RpcSimulateTransactionResult,
    },
    solana_sdk::{
        hash::{Hash, Hasher},
        pubkey::Pubkey,
        signature::{Keypair, Signature},
        transaction::{
            Transaction,
            TransactionError::{self},
        },
    },
    solana_transaction_status::TransactionStatus,
    std::{
        collections::HashMap,
        fs::File,
        io::BufReader,
        path::PathBuf,
        sync::Arc,
        time::{Duration, Instant},
    },
    tokio::{sync::Semaphore, time::sleep},
};

// #[derive(Clone, Deserialize, Serialize, Debug)]
// pub struct GeneratedMerkleTreeCollection {
//     pub generated_merkle_trees: Vec<GeneratedMerkleTree>,
// }

#[derive(Clone, Eq, Debug, Hash, PartialEq, Deserialize, Serialize)]
pub struct GeneratedMerkleTree {
    #[serde(with = "pubkey_string_conversion")]
    pub pool_pda: Pubkey,
    #[serde(with = "pubkey_string_conversion")]
    pub merkle_root_upload_authority: Pubkey,
    pub merkle_root: Hash,
    pub tree_nodes: Vec<TreeNode>,
    pub max_num_nodes: u64,
}

impl GeneratedMerkleTree {
    pub fn new_from_prize_meta_collection(
        prize_collection: &PrizeCollection,
        maybe_rpc_client: Option<SyncRpcClient>,
    ) -> Result<GeneratedMerkleTree, MerkleRootGeneratorError> {
        let generated_merkle_tree = prize_collection
            .prize_metas
            .into_iter()
            .filter_map(|prize_meta| {
                let mut tree_node = TreeNode::new(prize_meta.predictor, prize_meta.prize_amount);

                let hashed_nodes: Vec<[u8; 32]> =
                    tree_nodes.iter().map(|n| n.hash().to_bytes()).collect();

                let merkle_tree = MerkleTree::new(&hashed_nodes[..], true);
                let max_num_nodes = tree_nodes.len() as u64;

                for (i, tree_node) in tree_nodes.iter_mut().enumerate() {
                    tree_node.proof = Some(get_proof(&merkle_tree, i));
                }

                Some(Ok(GeneratedMerkleTree {
                    pool_pda: prize_collection.pool_pda,
                    merkle_root_upload_authority: prize_collection.merkle_root_upload_authority,
                    merkle_root: *merkle_tree.get_root().unwrap(),
                    tree_nodes,
                    max_num_nodes,
                }))
            })
            .collect::<Result<Vec<GeneratedMerkleTree>, MerkleRootGeneratorError>>()?;

        Ok(generated_merkle_tree)
    }
}

pub fn get_proof(merkle_tree: &MerkleTree, i: usize) -> Vec<[u8; 32]> {
    let mut proof = Vec::new();
    let path = merkle_tree.find_path(i).expect("path to index");
    for branch in path.get_proof_entries() {
        if let Some(hash) = branch.get_left_sibling() {
            proof.push(hash.to_bytes());
        } else if let Some(hash) = branch.get_right_sibling() {
            proof.push(hash.to_bytes());
        } else {
            panic!("expected some hash at each level of the tree");
        }
    }
    proof
}

#[derive(Clone, Eq, Debug, Hash, PartialEq, Deserialize, Serialize)]
pub struct TreeNode {
    /// The stake account entitled to redeem.
    #[serde(with = "pubkey_string_conversion")]
    pub predictor: Pubkey,

    /// The amount this account is entitled to.
    pub prize_amount: u64,

    /// The proof associated with this TreeNode
    pub proof: Option<Vec<[u8; 32]>>,
}

impl TreeNode {
    pub fn new(predictor: Pubkey, prize_amount: u64) -> Self {
        TreeNode {
            predictor,
            prize_amount,
            proof: None,
        }
    }

    fn hash(&self) -> Hash {
        let mut hasher = Hasher::default();
        hasher.hash(self.predictor.as_ref());
        hasher.hash(self.prize_amount.to_le_bytes().as_ref());
        hasher.result()
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct PrizeCollection {
    /// The pubkey of the account that will be used to upload the merkle root.
    pub merkle_root_upload_authority: Pubkey,

    /// List of [PrizeMeta].
    pub prize_metas: Vec<PrizeMeta>,

    /// base58 encoded prediction program id.
    #[serde(with = "pubkey_string_conversion")]
    pub program_id: Pubkey,

    /// The pubkey of the pool account.
    #[serde(with = "pubkey_string_conversion")]
    pub pool_pda: Pubkey,
}

#[derive(Clone, Deserialize, Serialize, Debug, PartialEq, Eq)]
pub struct PrizeMeta {
    #[serde(with = "pubkey_string_conversion")]
    pub predictor: Pubkey,

    /// The total amount of delegations to the validator.
    pub prize_amount: u64,
}

impl Ord for PrizeMeta {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        self.predictor
            .cmp(&other.predictor)
    }
}

impl PartialOrd<Self> for PrizeMeta {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

pub const MAX_RETRIES: usize = 5;
pub const FAIL_DELAY: Duration = Duration::from_millis(100);

pub async fn sign_and_send_transactions_with_retries(
    signer: &Keypair,
    rpc_client: &RpcClient,
    max_concurrent_rpc_get_reqs: usize,
    transactions: Vec<Transaction>,
    txn_send_batch_size: usize,
    max_loop_duration: Duration,
) -> (Vec<Transaction>, HashMap<Signature, Error>) {
    let semaphore = Arc::new(Semaphore::new(max_concurrent_rpc_get_reqs));
    let mut errors = HashMap::default();
    let mut blockhash = rpc_client
        .get_latest_blockhash()
        .await
        .expect("fetch latest blockhash");
    // track unsigned txns
    let mut transactions_to_process = transactions
        .into_iter()
        .map(|txn| (txn.message_data(), txn))
        .collect::<HashMap<Vec<u8>, Transaction>>();

    let start = Instant::now();
    while start.elapsed() < max_loop_duration && !transactions_to_process.is_empty() {
        // ensure we always have a recent blockhash
        // blockhashes last max 150 blocks
        // finalized commitment is ~32 slots behind tip
        // assuming 0% skip rate (every slot has a block), we’d have roughly 120 slots
        // or (120*0.4s) = 48s to land a tx before it expires
        // if we’re refreshing every 30s, then any txs sent immediately before the refresh would likely expire
        if start.elapsed() > Duration::from_secs(1) {
            blockhash = rpc_client
                .get_latest_blockhash()
                .await
                .expect("fetch latest blockhash");
        }
        info!(
            "Sending {txn_send_batch_size} of {} transactions to claim mev tips",
            transactions_to_process.len()
        );
        let send_futs = transactions_to_process
            .iter()
            .take(txn_send_batch_size)
            .map(|(hash, txn)| {
                let semaphore = semaphore.clone();
                async move {
                    let _permit = semaphore.acquire_owned().await.unwrap(); // wait until our turn
                    let (txn, res) = signed_send(signer, rpc_client, blockhash, txn.clone()).await;
                    (hash.clone(), txn, res)
                }
            });

        let send_res = futures::future::join_all(send_futs).await;
        let new_errors = send_res
            .into_iter()
            .filter_map(|(hash, txn, result)| match result {
                Err(e) => Some((txn.signatures[0], e)),
                Ok(..) => {
                    let _ = transactions_to_process.remove(&hash);
                    None
                }
            })
            .collect::<HashMap<_, _>>();

        errors.extend(new_errors);
    }

    (transactions_to_process.values().cloned().collect(), errors)
}

/// Just in time sign and send transaction to RPC
async fn signed_send(
    signer: &Keypair,
    rpc_client: &RpcClient,
    blockhash: Hash,
    mut txn: Transaction,
) -> (Transaction, solana_rpc_client_api::client_error::Result<()>) {
    txn.sign(&[signer], blockhash); // just in time signing
    let res = match rpc_client.send_and_confirm_transaction(&txn).await {
        Ok(_) => Ok(()),
        Err(e) => {
            match e.kind {
                // Already claimed, skip.
                ErrorKind::TransactionError(TransactionError::AlreadyProcessed)
                | ErrorKind::TransactionError(TransactionError::InstructionError(
                    0,
                    InstructionError::Custom(0),
                ))
                | ErrorKind::RpcError(RpcError::RpcResponseError {
                    data:
                        RpcResponseErrorData::SendTransactionPreflightFailure(
                            RpcSimulateTransactionResult {
                                err:
                                    Some(TransactionError::InstructionError(
                                        0,
                                        InstructionError::Custom(0),
                                    )),
                                ..
                            },
                        ),
                    ..
                }) => Ok(()),

                // transaction got held up too long and blockhash expired. retry txn
                ErrorKind::TransactionError(TransactionError::BlockhashNotFound) => Err(e),

                // unexpected error, warn and retry
                _ => {
                    error!(
                        "Error sending transaction. Signature: {}, Error: {e:?}",
                        txn.signatures[0]
                    );
                    Err(e)
                }
            }
        }
    };

    (txn, res)
}

/// Calculates the minimum balance needed to be rent-exempt
/// taken from: https://github.com/jito-foundation/jito-solana/blob/d1ba42180d0093dd59480a77132477323a8e3f88/sdk/program/src/rent.rs#L78
pub fn minimum_balance(data_len: usize) -> u64 {
    ((((ACCOUNT_STORAGE_OVERHEAD
        .checked_add(data_len as u64)
        .unwrap())
    .checked_mul(DEFAULT_LAMPORTS_PER_BYTE_YEAR))
    .unwrap() as f64)
        * DEFAULT_EXEMPTION_THRESHOLD) as u64
}

mod pubkey_string_conversion {
    use {
        serde::{self, Deserialize, Deserializer, Serializer},
        solana_sdk::pubkey::Pubkey,
        std::str::FromStr,
    };

    pub(crate) fn serialize<S>(pubkey: &Pubkey, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&pubkey.to_string())
    }

    pub(crate) fn deserialize<'de, D>(deserializer: D) -> Result<Pubkey, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        Pubkey::from_str(&s).map_err(serde::de::Error::custom)
    }
}

pub fn read_json_from_file<T>(path: &PathBuf) -> serde_json::Result<T>
where
    T: DeserializeOwned,
{
    let file = File::open(path).unwrap();
    let reader = BufReader::new(file);
    serde_json::from_reader(reader)
}

