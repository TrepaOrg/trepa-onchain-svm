import { BN, Program } from "@coral-xyz/anchor";
import { PublicKey, Transaction } from "@solana/web3.js";
import { Trepa } from "../../target/types/trepa";
import { getPoolPDAandIdArray } from "./getPDAs";
/**
 * Creates a new pool with the given question and prediction end time.
 * @param program - The program instance.
 * @param wallet - The wallet instance.
 * @param questionId - The question to be asked.
 * @param predictionEndTime - The timestamp when the prediction ends.
 */
export async function createPool(
    program: Program<Trepa>, 
    wallet: PublicKey, 
    questionId: string, 
    predictionEndTime: number
): Promise<Transaction> {
    
    //console.log("Program ID:", program.programId.toBase58());

    // Get the PDA for the pool
    const { poolPDA, questionBytes } = await getPoolPDAandIdArray(program, questionId);
    //console.log("Pool PDA:", poolPDA.toBase58());
    // Create the pool
    const tx = await program.methods
        .createPool(questionBytes, new BN(predictionEndTime))
        .accounts({
            pool: poolPDA,
            admin: wallet,
        })
        .transaction();

    //console.log(`Transaction created! ${tx}`);
    return tx;
}