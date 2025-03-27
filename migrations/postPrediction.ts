import * as anchor from "@project-serum/anchor";
import { Trepa } from "../target/types/trepa";
import { createPrediction } from "./utils/createPrediction";
import { POOL_ID } from "./constants";

async function main() {
  // Set up the provider and program
  const provider = anchor.AnchorProvider.env();
  const connecton = provider.connection;
  anchor.setProvider(provider);
  const program = anchor.workspace.Trepa as anchor.Program<Trepa>;

  if (!program) {
    throw new Error("⚠️ Program not found. Make sure it is deployed.");
  }

  console.log(`📜 Program loaded with ID: ${program.programId.toBase58()}`);


  const poolId = POOL_ID; // 16 bytes uuid
  
  // Prepare transaction to initialize the Config account
  const tx = await createPrediction(
    program, 
    connecton,
    provider.wallet.publicKey, 
    poolId, 
    10,
    0.01 // 0.01 SOL
  );

  const signature = await provider.sendAndConfirm(tx);
  console.log("Transaction Signature:", signature);
}

main()
  .then(() => console.log("Prediction created successfully"))
  .catch((err) => {
    console.error("Error creating prediction:", err);
  });
