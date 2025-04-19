import * as anchor from "@coral-xyz/anchor";
import { assert } from "chai";
import { Trepa } from "../target/types/trepa";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { createPool, createPrediction, resolvePool } from "../migrations/utils";
import { POOL_ID, PREDICTION_ID } from "../migrations/constants";
import { BN } from "bn.js";
import { getPredictionPDAandIdArray, getPoolPDAandIdArray } from "../migrations/utils/getPDAs";
import { before, describe } from "node:test";

// Assumes PREDICTION_ID is a 32-character hex string (representing 16 bytes).
function getPredictionIdForWallet(index: number): string {
  // Simply alter the last character (or any part) with the hex representation of index.
  // For example, if PREDICTION_ID = "0123456789abcdef0123456789abcdef",
  // this will produce a unique prediction id for each wallet.
  return PREDICTION_ID.slice(0, -1) + index.toString(16);
}

let predictionWallets: anchor.web3.Keypair[];

describe("Trepa contract stable tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.trepa as anchor.Program<Trepa>;

  // Create an array of prediction wallets and fund each with SOL
  before(async () => {
    predictionWallets = [];
    const numWallets = 5;
    for (let i = 0; i < numWallets; i++) {
      const wallet = anchor.web3.Keypair.generate();
      predictionWallets.push(wallet);
      const airdropSignature = await provider.connection.requestAirdrop(
        wallet.publicKey,
        3 * LAMPORTS_PER_SOL
      );
      const latestBlockhash = await provider.connection.getLatestBlockhash();
      await provider.connection.confirmTransaction({
        signature: airdropSignature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });
    }
  });

  it("initializes config account", async () => {
    const [configPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );

    // Set the parameters (same values as in migrations/initialize.ts)
    const minStake = new anchor.BN(10_000_000); // 0.01 SOL
    const maxStake = new anchor.BN(100_000_000_000); // 100 SOL (as u64 string)
    const maxRoi = new anchor.BN(10_000); // 100% expressed as basis points
    const platformFee = new anchor.BN(100); // 1% expressed as basis points

    const txSignature = await program.methods
      .initialize(minStake, maxStake, maxRoi, platformFee, provider.wallet.publicKey)
      .accounts({
        admin: provider.wallet.publicKey,
      })
      .rpc();

    const configAccount = await program.account.configAccount.fetch(configPDA);
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
    await provider.sendAndConfirm(tx);

    const { poolPDA, questionBytes } = await getPoolPDAandIdArray(program, POOL_ID);
    const poolAccount = await program.account.poolAccount.fetch(poolPDA);
    assert.ok(
      poolAccount.questionId.every((value: number, index: number) => value === questionBytes[index]),
      "Question is correct"
    );
    assert.ok(poolAccount.isFinalized === false, "Pool is not finalized");
    assert.ok(poolAccount.isResolved === false, "Pool is not resolved");
    assert.ok(poolAccount.totalStake.eq(new anchor.BN(0)), "Total stake is 0");
    assert.ok(
      poolAccount.predictionEndTime.gte(new BN(Math.floor(Date.now() / 1000) + 86399)),
      "Prediction end time is correct"
    );
  });

  // only asserts the first prediction
  it("predicts in the pool", async () => {
    let basePrediction = {
      prediction: 10, // 10%
      stake: 0.01,    // 0.01 SOL
    };

    for (let i = 0; i < predictionWallets.length; i++) {
      const wallet = predictionWallets[i];
      const predictionId = getPredictionIdForWallet(i);

      const tx = await createPrediction(
        program,
        provider.connection,
        wallet.publicKey,
        POOL_ID,
        basePrediction.prediction + i * 10,
        basePrediction.stake,
        predictionId
      );
      const signature = await provider.sendAndConfirm(tx, [wallet]);
      //console.log(`Prediction from wallet ${i} sent with signature: ${signature}`);
    }

    const { predictionPDA, predictionIdBytes } = await getPredictionPDAandIdArray(program, getPredictionIdForWallet(0));
    const predictionAccount = await program.account.predictionAccount.fetch(predictionPDA);

    const { poolPDA } = await getPoolPDAandIdArray(program, POOL_ID);
    const poolAccount = await program.account.poolAccount.fetch(poolPDA);

    assert.strictEqual(
      predictionAccount.predictionValue,
      basePrediction.prediction,
      "Prediction value is correct"
    );
    assert.ok(
      predictionAccount.predictionId.every((value: number, index: number) => value === predictionIdBytes[index]),
      "Prediction id is correct"
    );
    assert.ok(
      predictionAccount.predictor.equals(predictionWallets[0].publicKey),
      "Predictor is correct"
    );
    assert.ok(predictionAccount.pool.equals(poolPDA), "Pool is correct");
    assert.ok(
      poolAccount.totalStake.eq(new anchor.BN(basePrediction.stake * LAMPORTS_PER_SOL * predictionWallets.length)),
      "Total stake is correct"
    );
    assert.ok(predictionAccount.isClaimed === false, "Prediction is not claimed");
  });

  it("resolves the pool", async () => {
    const tx = await resolvePool(
      program,
      POOL_ID,
      provider.wallet.publicKey,
      [0.001],
      [predictionWallets[0].publicKey]
    );
    await provider.sendAndConfirm(tx);
  });
});
