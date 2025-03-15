import * as anchor from "@project-serum/anchor";
import { Trepa } from "../target/types/trepa";
import { createPrediction } from "./utils/createPrediction";
import { ConnectedSolanaWallet } from "@privy-io/react-auth";

async function main() {
  // Set up the provider and program
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Trepa as anchor.Program<Trepa>;

  if (!program) {
    throw new Error("⚠️ Program not found. Make sure it is deployed.");
  }

  console.log(`📜 Program loaded with ID: ${program.programId.toBase58()}`);


  const poolId = "ncky9dcofJYpziBxcCVpC1QmJ5QCZZJokLFPTTpyTVo";
  
  // Prepare transaction to initialize the Config account
  const tx = await createPrediction(
    program, 
    provider.wallet.publicKey, 
    poolId, 
    10,
    10000000 // 0.01 SOL
  );

  const signature = await provider.sendAndConfirm(tx);
  console.log("Transaction Signature:", signature);
}

main()
  .then(() => console.log("Initialization successful"))
  .catch((err) => {
    console.error("Error initializing:", err);
  });
