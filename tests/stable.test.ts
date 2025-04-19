import * as anchor from "@coral-xyz/anchor";
import { assert } from "chai";
import { Trepa } from "../target/types/trepa";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { createPool, createPrediction, resolvePool } from "../migrations/utils";
import { POOL_ID, PREDICTION_ID } from "../migrations/constants";
import { BN } from "bn.js";
import { getPredictionPDAandIdArray, getPoolPDAandIdArray } from "../migrations/utils/getPDAs";

let predictionWallet: anchor.web3.Keypair;

describe("Trepa contract stable tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.trepa as anchor.Program<Trepa>;

  // Create a new wallet and fund it with SOL
  before(async () => {
    predictionWallet = anchor.web3.Keypair.generate();
    const airdropSignature = await provider.connection.requestAirdrop(
      predictionWallet.publicKey,
      3 * LAMPORTS_PER_SOL
    );
    const latestBlockhash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      signature: airdropSignature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });
    //console.log(predictionWallet.publicKey.toBase58());
  });
  
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

    const { poolPDA, questionBytes } = await getPoolPDAandIdArray(program, POOL_ID);

    const poolAccount = await program.account.poolAccount.fetch(poolPDA);
    assert.ok(poolAccount.questionId.every((value, index) => value === questionBytes[index]), "Question is correct");
    assert.ok(poolAccount.isFinalized === false, "Pool is not finalized");
    assert.ok(poolAccount.isResolved === false, "Pool is not resolved");
    assert.ok(poolAccount.totalStake.eq(new anchor.BN(0)), "Total stake is 0");
    assert.ok(poolAccount.predictionEndTime >= new BN(Math.floor(Date.now() / 1000) + 86399), "Prediction end time is correct");
  });

  it("predicts in the pool", async () => {
    const defaultPrediction = {
      prediction: 10, // 10%
      stake: 0.01, // 0.01 SOL
      predictionId: PREDICTION_ID
    }

    const tx = await createPrediction(
      program,
      provider.connection,
      predictionWallet.publicKey, 
      POOL_ID,
      defaultPrediction.prediction,
      defaultPrediction.stake,
      defaultPrediction.predictionId
    );

    const signature = await provider.sendAndConfirm(tx, [predictionWallet]);

    const { predictionPDA, predictionIdBytes } = await getPredictionPDAandIdArray(program, defaultPrediction.predictionId);
    const predictionAccount = await program.account.predictionAccount.fetch(predictionPDA);
  
    const { poolPDA, questionBytes } = await getPoolPDAandIdArray(program, POOL_ID);

    const poolAccount = await program.account.poolAccount.fetch(poolPDA);

    assert.ok(predictionAccount.predictionValue === defaultPrediction.prediction, "Prediction value is correct");
    assert.ok(predictionAccount.predictionId.every((value, index) => value === predictionIdBytes[index]), "Prediction id is correct");
    assert.ok(predictionAccount.predictor.equals(predictionWallet.publicKey), "Predictor is correct");
    assert.ok(predictionAccount.pool.equals(poolPDA), "Pool is correct");
    assert.ok(poolAccount.totalStake.eq(new anchor.BN(defaultPrediction.stake * LAMPORTS_PER_SOL)), "Total stake is correct")
    assert.ok(predictionAccount.isClaimed === false, "Prediction is not claimed");
  });

  it("finalizes the pool", async () => {
    const tx = await resolvePool(program, POOL_ID, provider.wallet.publicKey, [0.001], [predictionWallet.publicKey]);
    const signature = await provider.sendAndConfirm(tx);
    // console.log("Pool finalization transaction signature:", signature);
  });
});
