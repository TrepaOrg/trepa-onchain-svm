pub mod constants;

use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::{commitment_config::CommitmentConfig, pubkey::Pubkey, signature::Signature};
use solana_transaction_status::{
    EncodedTransaction, UiMessage, UiTransactionEncoding, option_serializer::OptionSerializer,
};
use solana_client::rpc_client::GetConfirmedSignaturesForAddress2Config;
use chrono::{DateTime, Utc};

use anyhow::Result;
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() -> Result<()> {
    let client = RpcClient::new_with_commitment(constants::RPC_URL.to_string(), CommitmentConfig::confirmed());
    let monitored_pubkey: Pubkey = constants::PUBLIC_KEY.parse()?;
    let mut last_signature = None;
    let mut last_processed_time: Option<DateTime<Utc>> = Some(Utc::now());

    println!("Listening for events from {}", constants::PUBLIC_KEY);

    loop {
        let config = GetConfirmedSignaturesForAddress2Config {
            until: last_signature.clone(),
            ..Default::default()
        };

        let sigs = client
            .get_signatures_for_address_with_config(&monitored_pubkey, config)
            .await?;

        for sig_info in sigs.iter().rev() {
            let tx_sig = sig_info.signature.parse::<Signature>()?;
            
            // Get the block time as an Option<i64> (seconds since epoch)
            let block_time_secs_opt = sig_info.block_time;
            if let Some(block_time_secs) = block_time_secs_opt {
                // Convert last_processed_time (Option<DateTime<Utc>>) to seconds
                let last_processed_secs = last_processed_time
                    .map(|dt| dt.timestamp())
                    .unwrap_or(0);

                if block_time_secs <= last_processed_secs {
                    continue;
                }

                let tx_result = client
                    .get_transaction(&tx_sig, UiTransactionEncoding::JsonParsed)
                    .await;

                if tx_result.is_err() {
                    continue;
                }

                let tx = tx_result.unwrap();
                if tx.transaction.meta.is_none() || tx.transaction.meta.as_ref().unwrap().err.is_some() {
                    continue;
                }

                if let Some(meta) = &tx.transaction.meta {
                    println!("log transaction: {:?}", meta);
                    if let OptionSerializer::Some(logs) = &meta.log_messages {
                        if logs.iter().any(|log| log.contains("Instruction: ResolvePool")) {
                            println!("Detected event: {:?}", logs);
                        }
                    }
                }

                last_processed_time = Some(DateTime::<Utc>::from_timestamp(block_time_secs, 0).expect("Valid timestamp"));
                last_signature = Some(tx_sig);
            }
        }

        sleep(Duration::from_secs(10)).await;
    }
}
