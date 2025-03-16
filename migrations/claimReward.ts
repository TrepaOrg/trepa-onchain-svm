import * as anchor from "@project-serum/anchor";
import { Trepa } from "../target/types/trepa";
import { claimReward } from "./utils/claimReward";

async function main() {
  // Set up the provider and program
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Trepa as anchor.Program<Trepa>;

  if (!program) {
    throw new Error("⚠️ Program not found. Make sure it is deployed.");
  }

  console.log(`📜 Program loaded with ID: ${program.programId.toBase58()}`);


  const poolId = "b9cdc74e-c59a-4dbc-8006-c3e326040816"; // 16 bytes uuid
  
  // Prepare transaction to initialize the Config account
  const tx = await claimReward(
    program, 
    provider.wallet.publicKey, 
    poolId, 
  );

  const signature = await provider.sendAndConfirm(tx);
  console.log("Transaction Signature:", signature);
}

main()
  .then(() => console.log("Claim reward successful"))
  .catch((err) => {
    console.error("Error claiming reward:", err);
  });
