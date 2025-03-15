import { BN, Program } from "@project-serum/anchor";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { Trepa } from "../../target/types/trepa";

/**
 * Creates a new prediction.
 * @param program - The program instance.
 * @param wallet - The wallet instance.
 * @param poolId - The pool to be predicted.
 * @param prediction - The prediction to be made.
 * @param stake - The stake to be made.
 */
export async function createPrediction(
    program: Program<Trepa>, 
    wallet: PublicKey, 
    poolId: string, 
    prediction: number,
    stake: number
): Promise<Transaction> {
    const poolAddress = new PublicKey(poolId);
    console.log("Program ID:", program.programId.toBase58());
    console.log("Pool Address:", poolAddress.toBase58());

    // Get the PDA for the prediction       
    const [predictionPDA] = await PublicKey.findProgramAddressSync(
        [Buffer.from("prediction"), poolAddress.toBuffer(), wallet.toBuffer()],
        program.programId
    );
    // Create the prediction
    const tx = await program.methods
        .predict(prediction, new BN(stake))
        .accounts({
            prediction: predictionPDA,
            pool: poolAddress,
            predictor: wallet,

            systemProgram: SystemProgram.programId,
        })
        .transaction();

    console.log(`Transaction created! ${tx}`);
    return tx;
}