import { BN, Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, SYSVAR_CLOCK_PUBKEY, Transaction } from "@solana/web3.js";
import { Trepa } from "../../target/types/trepa";

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
    const cleanedQuestionId = questionId.replace(/-/g, '');
    const questionBytes = Buffer.from(cleanedQuestionId, 'hex');
    const questionArray = Array.from(questionBytes);
    if (questionArray.length !== 16) {
        throw new Error(`Question must be 16 bytes, not ${questionArray.length} bytes for string ${questionBytes}`);
    }
    //console.log("Program ID:", program.programId.toBase58());

    // Get the PDA for the pool
    const [poolPDA] = await PublicKey.findProgramAddressSync(
        [Buffer.from("pool"), questionBytes],
        program.programId
    );

    //console.log("Pool PDA:", poolPDA.toBase58());
    // Create the pool
    const tx = await program.methods
        .createPool(questionArray, new BN(predictionEndTime))
        .accounts({
            pool: poolPDA,
            admin: wallet,
        })
        .transaction();

    //console.log(`Transaction created! ${tx}`);
    return tx;
}