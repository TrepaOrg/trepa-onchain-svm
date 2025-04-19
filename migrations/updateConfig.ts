import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Trepa } from "../target/types/trepa";

const newConfig = {
  minStake: 5000000, // 0.005 SOL
  maxStake: 1000000000, // 1 SOL
  maxRoi: 15000, // 150%
  platformFee: 50, // 0.5%
}

async function main() {
  // Set up the provider and program
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Trepa as anchor.Program<Trepa>;
  
  console.log(`Program loaded with ID: ${program.programId.toBase58()}`);

  // Derive PDA for the config account using seed "config"
  const [configPDA, configBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );
  console.log(`Config PDA: ${configPDA.toBase58()} (bump: ${configBump})`);

  const { minStake, maxStake, maxRoi, platformFee } = newConfig;

  // Call the updateParameters method on the program
  const txSignature = await program.methods
    .updateConfig(
        new anchor.BN(minStake), 
        new anchor.BN(maxStake), 
        new anchor.BN(maxRoi), 
        new anchor.BN(platformFee)
    )
    .accounts({
      admin: provider.wallet.publicKey,
      config: configPDA,
    })
    .rpc();

  console.log("Transaction Signature:", txSignature);
}

main()
  .then(() => console.log("Config update successful"))
  .catch((err) => console.error("Error updating config:", err));
