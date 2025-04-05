use {
    clap::Parser, log::info, solana_sdk::pubkey::Pubkey,
    std::path::PathBuf,
    resolution_prover::merkle_root_upload_workflow::upload_merkle_root,
    std::convert::TryInto,
    hex,
    dotenv,
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

fn main() {
    // Load the environment variables from a `.env` file, if present.
    dotenv::dotenv().ok();

    env_logger::init();

    let args: Args = Args::parse();

    // Decode the pool_id from hex to a vector of bytes.
    let pool_id_bytes = hex::decode(&args.pool_id)
        .expect("failed to decode pool_id from hex");
    
    // Ensure the vector has exactly 16 bytes and convert it to a fixed-size array.
    let pool_id_array: [u8; 16] = pool_id_bytes[..]
        .try_into()
        .expect("pool_id must be 16 bytes long");

    // Check the pool_id length as before.
    // if pool_id_array.len() != 16 {
    //     panic!("pool_id must be 16 bytes");
    //}

    info!("starting merkle root uploader...");
    if let Err(error) = upload_merkle_root(
       &args.merkle_root_path,
       &args.keypair_path,
       &args.rpc_url,
       &args.program_id,
       pool_id_array,
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
