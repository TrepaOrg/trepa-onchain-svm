import * as anchor from "@coral-xyz/anchor";
import { assert } from "chai";
import { Trepa } from "../target/types/trepa";
import { PublicKey } from "@solana/web3.js";
import { createPool } from "../migrations/utils/createPool";
import { createPrediction } from "../migrations/utils/createPrediction";

const POOL_ID = "00000000-0000-0000-0000-000000000000";
const cleanedPoolId = POOL_ID.replace(/-/g, "");
const questionBytes = Buffer.from(cleanedPoolId, "hex");

describe("Trepa contract stable", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.trepa as anchor.Program<Trepa>;

  it("initializes config account", async () => {
    // Derive the config PDA using the seed "config"
    const [configPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );
    //console.log("Config PDA:", configPDA.toBase58());

    // Set the parameters (same values as in migrations/initialize.ts)
    const minStake = new anchor.BN(10_000_000); // 0.01 SOL
    const maxStake = new anchor.BN(100_000_000_000); // 100 SOL (as u64 string)
    const maxRoi = new anchor.BN(10_000); // 100% expressed as basis points
    const platformFee = new anchor.BN(100); // 1% expressed as basis points

    const txSignature = await program.methods
      .initialize(minStake, maxStake, maxRoi, platformFee)
      .accounts({
        admin: provider.wallet.publicKey,
        treasury: provider.wallet.publicKey,
      })
      .rpc();

    // console.log("Initialization transaction signature:", txSignature);
    
    const configAccount = await program.account.configAccount.fetch(configPDA) as any;
    assert.ok(configAccount.admin.equals(provider.wallet.publicKey));
    assert.ok(configAccount.minStake.eq(minStake));
    assert.ok(configAccount.maxStake.eq(maxStake));
    assert.ok(configAccount.maxRoi.eq(maxRoi));
    assert.ok(configAccount.platformFee.eq(platformFee));
  });

  it("creates a new pool", async () => {
    
    const tx = await createPool(
      program, 
      provider.wallet.publicKey, 
      POOL_ID, 
      Math.floor(Date.now() / 1000) + 86400
    );
    
    const signature = await provider.sendAndConfirm(tx);
    // console.log("Pool creation transaction signature:", signature);

    const [poolPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), questionBytes],
      program.programId
    );

    const poolAccount = await program.account.poolAccount.fetch(poolPDA);
    assert.ok(Buffer.from(poolAccount.question).equals(questionBytes), "Question is correct");
    assert.ok(poolAccount.isFinalized === false, "Pool is finalized");
    assert.ok(poolAccount.isResolved === false, "Pool is resolved");
    assert.ok(poolAccount.totalStake.eq(new anchor.BN(0)), "Total stake is not 0");
    assert.ok(poolAccount.predictionEndTime.eq(new anchor.BN(Math.floor(Date.now() / 1000) + 86400)), "Prediction end time is correct");
  });

  it("predicts in the pool", async () => {

    const tx = await createPrediction(
      program,
      provider.connection,
      provider.wallet.publicKey, 
      POOL_ID,
      10,
      0.01 // 0.01 SOL
    );

    const signature = await provider.sendAndConfirm(tx);

    const [predictionPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("prediction"), questionBytes],
      program.programId
    );
    const predictionAccount = await program.account.predictionAccount.fetch(predictionPDA);
    assert.ok(predictionAccount.prediction.eq(new anchor.BN(10)), "Prediction is correct");
    assert.ok(predictionAccount.amount.eq(new anchor.BN(0.01)), "Amount is correct");
    // console.log("Prediction transaction signature:", signature);
  });
});
