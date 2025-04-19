import * as anchor from "@coral-xyz/anchor";
import { assert } from "chai";
import { Trepa } from "../target/types/trepa";
import { PublicKey } from "@solana/web3.js";

describe("Trepa contract deploy and initialization", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.trepa as anchor.Program<Trepa>;

  let configPDA: PublicKey;

  it("initializes the Trepa config account", async () => {
    // Derive the config PDA using the seed "config"
    const [configPDA] = await PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );
    console.log("Config PDA:", configPDA.toBase58());

    // Set the parameters (same values as in your migrations/initialize.ts)
    const minStake = new anchor.BN(10_000_000); // 0.01 SOL
    const maxStake = new anchor.BN(100_000_000_000); // 100 SOL (as u64 string)
    const maxRoi = new anchor.BN(10_000); // 100% expressed as basis points
    const platformFee = new anchor.BN(100); // 1% expressed as basis points

    const tx = await program.methods
      .initialize(minStake, maxStake, maxRoi, platformFee)
      .accounts({
        admin: provider.wallet.publicKey,
        treasury: provider.wallet.publicKey,
      })
      .rpc();

    console.log("Initialization transaction signature:", tx);
    
    const configAccount = await program.account.configAccount.fetch(configPDA) as any;
    assert.ok(configAccount.admin.equals(provider.wallet.publicKey));
    assert.ok(configAccount.minStake.eq(minStake));
    assert.ok(configAccount.maxStake.eq(maxStake));
    assert.ok(configAccount.maxRoi.eq(maxRoi));
    assert.ok(configAccount.platformFee.eq(platformFee));
  });
});
