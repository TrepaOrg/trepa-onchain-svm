use {
    clap::Parser, log::info, solana_sdk::pubkey::Pubkey,
    std::path::PathBuf,
    resolution_prover::merkle_root_upload_workflow::upload_merkle_root,
};

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Path to JSON file containing the [StakeMetaCollection] object.
    #[arg(long, env)]
    merkle_root_path: PathBuf,

    /// The path to the keypair used to sign and pay for the `upload_merkle_root` transactions.
    #[arg(long, env)]
    keypair_path: PathBuf,

    /// The RPC to send transactions to.
    #[arg(long, env)]
    rpc_url: String,

    /// The program ID of the prediction program.
    #[arg(long, env)]
    program_id: Pubkey,

    /// The pool ID of the prediction pool.
    #[arg(long, env, default_value = "b9cdc74e-c59a-4dbc-8006-c3e326040824")]
    pool_id: Vec<u8>,

    /// Rate-limits the maximum number of requests per RPC connection
    #[arg(long, env, default_value_t = 100)]
    max_concurrent_rpc_get_reqs: usize,

    /// Number of transactions to send to RPC at a time.
    #[arg(long, env, default_value_t = 64)]
    txn_send_batch_size: usize,
}

fn main() {
    env_logger::init();

    let args: Args = Args::parse();

    if args.pool_id.len() != 16 {
        panic!("pool_id must be 16 bytes");
    }

    info!("starting merkle root uploader...");
    if let Err(error) = upload_merkle_root(
       &args.merkle_root_path,
       &args.keypair_path,
       &args.rpc_url,
       &args.program_id,
       args.pool_id.try_into().unwrap(),
       args.max_concurrent_rpc_get_reqs,
       args.txn_send_batch_size,
    ) {
        panic!("failed to upload merkle roots: {:?}", error);
    }
    info!(
        "uploaded merkle roots from file {:?}",
        args.merkle_root_path
    );
}
