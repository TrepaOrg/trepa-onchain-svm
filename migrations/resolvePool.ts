import * as anchor from "@project-serum/anchor";
import { Trepa } from "../target/types/trepa";
import { resolvePool } from "./utils/resolvePool";

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
  // Calculate prediction end time one year later (in seconds)
  // Prepare transaction to initialize the Config account
  const tx = await resolvePool(
    program, 
    poolId, 
    provider.wallet.publicKey, 
    [1000000],
    [provider.wallet.publicKey]
  );

  console.log("Pool PDA:", tx.instructions[0].keys[1].pubkey.toBase58());

  const signature = await provider.sendAndConfirm(tx);
  console.log("Transaction Signature:", signature);
}

main()
  .then(() => console.log("Resolved pool successfully"))
  .catch((err) => {
    console.error("Error resolving pool:", err);
  });
