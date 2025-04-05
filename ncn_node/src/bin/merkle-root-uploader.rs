use {
    clap::Parser,
    log::info,
    solana_client::{
        nonblocking::rpc_client::RpcClient,
        rpc_client::GetConfirmedSignaturesForAddress2Config,
    },
    solana_sdk::{
        commitment_config::CommitmentConfig,
        pubkey::Pubkey,
        signature::Signature,
    },
    resolution_prover::merkle_root_upload_workflow::upload_merkle_root,
    std::convert::TryInto,
    hex,
    dotenv,
    anyhow::Result,
    solana_transaction_status::{
        UiTransactionEncoding, option_serializer::OptionSerializer,
    },
    chrono::{DateTime, Utc},
    tokio::time::{sleep, Duration},
};

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Path to JSON file containing the [StakeMetaCollection] object.
    #[arg(long, env)]
    merkle_root_path: std::path::PathBuf,

    /// The path to the keypair used to sign and pay for the `upload_merkle_root` transactions.
    #[arg(long, env)]
    keypair_path: std::path::PathBuf,

    /// The RPC to send transactions to.
    #[arg(long, env)]
    rpc_url: String,

    /// The program ID of the prediction program.
    #[arg(long, env)]
    program_id: Pubkey,

    /// The pool ID of the prediction pool (in hexadecimal).
    #[arg(long, env, default_value = "b9cdc74ec59a4dbc8006c3e326040824")]
    pool_id: String,

    /// Rate-limits the maximum number of requests per RPC connection
    #[arg(long, env, default_value_t = 100)]
    max_concurrent_rpc_get_reqs: usize,

    /// Number of transactions to send to RPC at a time.
    #[arg(long, env, default_value_t = 64)]
    txn_send_batch_size: usize,
}

#[tokio::main]
async fn main() -> Result<()> {
    // Load environment variables from a `.env` file, if present.
    dotenv::dotenv().ok();

    env_logger::init();

    let args: Args = Args::parse();

    // Create an asynchronous RPC client with confirmed commitment.
    let rpc_client = RpcClient::new_with_commitment(args.rpc_url.clone(), CommitmentConfig::confirmed());

    // The account to monitor is currently provided as the program ID.
    let monitored_pubkey = args.program_id;
    
    loop {
        println!("Waiting for event on {} before uploading merkle roots...", monitored_pubkey);
        
        // Wait for the event that includes the log "Instruction: ResolvePool"
        wait_for_event(&rpc_client, monitored_pubkey).await?;
        info!("Event detected, now uploading merkle roots...");

        // Decode the pool_id from hex to a vector of bytes.
        let pool_id_bytes = hex::decode(&args.pool_id)
            .expect("failed to decode pool_id from hex");

        // Ensure the vector has exactly 16 bytes and convert it to a fixed-size array.
        let pool_id_array: [u8; 16] = pool_id_bytes[..]
            .try_into()
            .expect("pool_id must be 16 bytes long");

        if let Err(error) = upload_merkle_root(
           &args.merkle_root_path,
           &args.keypair_path,
           &args.rpc_url,
           &args.program_id,
           pool_id_array,
           args.max_concurrent_rpc_get_reqs,
           args.txn_send_batch_size,
        ).await {
            panic!("failed to upload merkle roots: {:?}", error);
        }
        info!("Uploaded merkle roots from file {:?}. Waiting for next event...", args.merkle_root_path);
    }
}

/// Waits for a transaction event with a log containing "Instruction: ResolvePool"
async fn wait_for_event(rpc_client: &RpcClient, monitored_pubkey: Pubkey) -> Result<()> {
    let mut last_signature: Option<Signature> = None;
    let mut last_processed_time: Option<DateTime<Utc>> = Some(Utc::now());

    loop {
        let config = GetConfirmedSignaturesForAddress2Config {
            until: last_signature.clone(),
            ..Default::default()
        };

        let signatures = rpc_client
            .get_signatures_for_address_with_config(&monitored_pubkey, config)
            .await?;

        // Process the signatures in chronological order.
        for signature_info in signatures.iter().rev() {
            let tx_signature = signature_info.signature.parse::<Signature>()?;
            if let Some(block_time_secs) = signature_info.block_time {
                let last_processed_secs = last_processed_time
                    .map(|date_time| date_time.timestamp())
                    .unwrap_or(0);

                if block_time_secs <= last_processed_secs {
                    continue;
                }

                let tx_result = rpc_client
                    .get_transaction(&tx_signature, UiTransactionEncoding::JsonParsed)
                    .await;

                if tx_result.is_err() {
                    continue;
                }

                let transaction = tx_result.unwrap();

                if let Some(transaction_meta) = transaction.transaction.meta {
                    if let OptionSerializer::Some(logs) = transaction_meta.log_messages {
                        if logs.iter().any(|log| log.contains("Instruction: ResolvePool")) {
                            println!(
                                "Detected event from transaction {}: {:?}",
                                tx_signature, logs
                            );
                            return Ok(());
                        }
                    }
                }

                // Update processed time and signature so we don't reprocess the same events.
                last_processed_time = DateTime::<Utc>::from_timestamp(block_time_secs, 0);
                last_signature = Some(tx_signature);
            }
        }

        sleep(Duration::from_secs(10)).await;
    }
}
