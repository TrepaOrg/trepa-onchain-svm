import * as anchor from "@project-serum/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Trepa } from "../target/types/trepa";

async function main() {
  // Set up the provider and program
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Trepa as anchor.Program<Trepa>;

  if (!program) {
    throw new Error("⚠️ Program not found. Make sure it is deployed.");
  }

  console.log(`📜 Program loaded with ID: ${program.programId.toBase58()}`);

  // Derive PDA for the config account using seed "config"
  const [configPDA] = await PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );
  const minStake = new anchor.BN(10000000); // 0.01 SOL
  const maxStake = new anchor.BN("1000000000000000000"); // 1 SOL (use string for large numbers)
  const maxRoi = new anchor.BN(10000); // 100%
  const platformFee = new anchor.BN(100); // 1%


  // Prepare transaction to initialize the Config account
  const tx = await program.methods
    .initialize(
      minStake,
      maxStake,
      maxRoi,
      platformFee
    )
    .accounts({
      config: configPDA,
      admin: provider.wallet.publicKey,
      treasury: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("Transaction Signature:", tx);

  // Fetch and display the initialized account
  const account = await program.account.configAccount.fetch(configPDA);
  console.log("Initialized Config Account:", account);
}

main()
  .then(() => console.log("Initialization successful"))
  .catch((err) => {
    console.error("Error initializing:", err);
  });
