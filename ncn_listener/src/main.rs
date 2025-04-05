pub mod constants;

use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::{commitment_config::CommitmentConfig, pubkey::Pubkey, signature::Signature};
use solana_transaction_status::{
    EncodedTransaction, UiMessage, UiTransactionEncoding,
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
        let sigs = client
            .get_signatures_for_address_with_config(
                &monitored_pubkey,
                GetConfirmedSignaturesForAddress2Config {
                    before: last_signature.clone(),
                    ..Default::default()
                },
            )
            .await?;

        for sig_info in sigs.iter().rev() {
            let tx_sig = sig_info.signature.parse::<Signature>()?;
            let block_time = sig_info.block_time.and_then(|t| {
                DateTime::<Utc>::from_timestamp(t, 0)
            });

            if block_time.is_some() && block_time <= last_processed_time {
                continue;
            }

            let tx = client
                .get_transaction(&tx_sig, UiTransactionEncoding::JsonParsed)
                .await;

            if tx.is_err() {
                continue;
            }

            let tx = tx.unwrap();
            if tx.transaction.meta.is_none() || tx.transaction.meta.as_ref().unwrap().err.is_some() {
                continue;
            }

            if let EncodedTransaction::Json(tx_json) = tx.transaction.transaction {
                if let UiMessage::Parsed(msg) = tx_json.message {
                    for instr in msg.instructions {
                        println!("Detected event: {:?}", instr);
                    }
                }
            }

            if let Some(block_time) = block_time {
                last_processed_time = Some(block_time);
            }
            last_signature = Some(sig_info.signature.parse::<Signature>()?);
        }

        sleep(Duration::from_secs(10)).await;
    }
}
