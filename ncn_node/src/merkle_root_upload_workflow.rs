use {
    crate::constants::{CONFIG_ACCOUNT_PUBKEY, TREASURY_TOKEN_ACCOUNT_PUBKEY, TOKEN_PROGRAM_PUBKEY},
    crate::{
        read_json_from_file, sign_and_send_transactions_with_retries, GeneratedMerkleTree,
    },
    crate::utils::{create_prove_resolution_instruction, ProveResolutionAccounts},
    log::{error, info},
    solana_client::nonblocking::rpc_client::RpcClient,
    solana_program::{
        fee_calculator::DEFAULT_TARGET_LAMPORTS_PER_SIGNATURE, native_token::LAMPORTS_PER_SOL,
    },
    solana_sdk::{
        commitment_config::CommitmentConfig,
        pubkey::Pubkey,
        signature::{read_keypair_file, Signer},
        transaction::Transaction,
    },
    anchor_lang::{AnchorDeserialize, AnchorSerialize},
    std::{path::PathBuf, time::Duration},
    thiserror::Error,
    spl_associated_token_account::get_associated_token_address,
    crate::constants::WSOL_MINT_PUBKEY,
};

#[derive(Error, Debug)]
pub enum MerkleRootUploadError {
    #[error(transparent)]
    IoError(#[from] std::io::Error),

    #[error(transparent)]
    JsonError(#[from] serde_json::Error),
}

pub async fn upload_merkle_root(
    merkle_root_path: &PathBuf,
    keypair_path: &PathBuf,
    rpc_url: &str,
    program_id: &Pubkey,
    pool_id: [u8; 16],
    max_concurrent_rpc_get_reqs: usize,
    txn_send_batch_size: usize,
) -> Result<(), MerkleRootUploadError> {
    const MAX_RETRY_DURATION: Duration = Duration::from_secs(600);

    let merkle_tree: Vec<GeneratedMerkleTree> =
        read_json_from_file(merkle_root_path).expect("read GeneratedMerkleTreeCollection");
    let keypair = read_keypair_file(keypair_path).expect("read keypair file");
    let pool_pda = Pubkey::find_program_address(&[b"pool", &pool_id[..]], program_id).0;

    // Create an asynchronous RPC client with confirmed commitment.
    let rpc_client =
        RpcClient::new_with_commitment(rpc_url.to_string(), CommitmentConfig::confirmed());
    let trees: Vec<GeneratedMerkleTree> = merkle_tree
        .into_iter()
        .filter(|tree| tree.merkle_root_upload_authority == keypair.pubkey())
        .collect();

    info!("num trees to upload: {:?}", trees.len());

    // Check that the keypair has sufficient funds.
    {
        let initial_balance = rpc_client
            .get_balance(&keypair.pubkey())
            .await
            .expect("failed to get balance");
        let desired_balance = (trees.len() as u64)
            .checked_mul(DEFAULT_TARGET_LAMPORTS_PER_SIGNATURE)
            .unwrap();
        if initial_balance < desired_balance {
            let sol_to_deposit = desired_balance
                .checked_sub(initial_balance)
                .unwrap()
                .checked_add(LAMPORTS_PER_SOL)
                .unwrap()
                .checked_sub(1)
                .unwrap()
                .checked_div(LAMPORTS_PER_SOL)
                .unwrap();
            panic!(
                "Expected to have at least {} lamports in {}, current balance is {} lamports, deposit {} SOL to continue.",
                desired_balance,
                &keypair.pubkey(),
                initial_balance,
                sol_to_deposit
            );
        }
    }

    let mut trees_needing_update: Vec<GeneratedMerkleTree> = vec![];
    println!("pool_pda: {:?}", pool_pda);
    for tree in trees {
        trees_needing_update.push(tree);
    }
    info!(
        "num trees need uploading: {:?}",
        trees_needing_update.len()
    );

    let pool_token_account = get_associated_token_address(&pool_pda, &*WSOL_MINT_PUBKEY);
    let treasury_token_account = *TREASURY_TOKEN_ACCOUNT_PUBKEY;
    let config = *CONFIG_ACCOUNT_PUBKEY;
    let wsol_mint = *WSOL_MINT_PUBKEY;
    let token_program = *TOKEN_PROGRAM_PUBKEY;

    let transactions: Vec<Transaction> = trees_needing_update
        .iter()
        .map(|tree| {
            let ix = create_prove_resolution_instruction(
                *program_id,
                tree.merkle_root,
                ProveResolutionAccounts {
                    merkle_root_upload_authority: keypair.pubkey(),
                    pool: pool_pda,
                    pool_token_account,
                    treasury_token_account,
                    config,
                    wsol_mint,
                    token_program,
                },
            );
            Transaction::new_with_payer(&[ix], Some(&keypair.pubkey()))
        })
        .collect();

    let (to_process, failed_transactions) = sign_and_send_transactions_with_retries(
        &keypair,
        &rpc_client,
        max_concurrent_rpc_get_reqs,
        transactions,
        txn_send_batch_size,
        MAX_RETRY_DURATION,
    )
    .await;

    if !to_process.is_empty() {
        panic!(
            "{} transactions sent, {} failed requests.",
            to_process.len(),
            failed_transactions.len()
        );
    }

    Ok(())
}

#[derive(AnchorSerialize, AnchorDeserialize, Debug)]
pub struct PoolAccount {
    pub question: [u8; 16],         // The prediction question (identifier) always 16 bytes
    pub prediction_end_time: i64,   // When prediction period ends
    pub total_stake: u64,           // Total tokens staked
    pub is_being_resolved: bool,    // Whether the pool is being resolved
    pub is_finalized: bool,         // Whether the pool has been finalized and proved
    pub bump: u8,                   // PDA bump
    pub proof: i64,                 // Proof of the pool resolution (root)
    pub prize_sum: u64,             // Sum of the prizes
}