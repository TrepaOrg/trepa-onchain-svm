import * as anchor from "@project-serum/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";

async function main() {
  // Set up the provider and program
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.MerkleTree as anchor.Program;

  // Generate a PDA for the Merkle Tree account
  const [merkleTreePda, bump] = await PublicKey.findProgramAddressSync(
    [Buffer.from("merkle-tree")],
    program.programId
  );

  console.log("Derived PDA for Merkle Tree:", merkleTreePda.toBase58());
  
  console.log("Merkle Tree Bump:", bump);
  
  // Prepare transaction to initialize the Merkle Tree account
  const tx = await program.methods
    .initialize()
    .accounts({
      merkleTree: merkleTreePda,
      signer: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("Transaction Signature:", tx);

  // Fetch and display the initialized account
  const account = await program.account.merkleTree.fetch(merkleTreePda);
  console.log("Initialized Merkle Tree Account:", account);
}

main()
  .then(() => console.log("Deployment successful"))
  .catch((err) => {
    console.error("Error deploying program:", err);
  });
