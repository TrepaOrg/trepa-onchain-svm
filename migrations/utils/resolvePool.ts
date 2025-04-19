import { BN, Program } from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";
import { Trepa } from "../../target/types/trepa";
import { getAssociatedTokenAddress } from "@solana/spl-token";

// WSOL mint address (same on all networks)
const WSOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");

/**
 * Resolves a pool with the given question and prediction end time.
 * @param program - The program instance.
 * @param poolId - The pool to be resolved. (same as the question id)
 * @param admin - The admin account.    
 * @param prizes - The prizes to be distributed.
 * @param predictors - The predictors to get prizes.
 */
export async function resolvePool(
    program: Program<Trepa>, 
    poolId: string, 
    admin: PublicKey,
    prizes: number[],
    predictors: PublicKey[]
): Promise<Transaction> {
    console.log("Program ID:", program.programId.toBase58());

    // Get the PDA for the pool
    const cleanedPoolId = poolId.replace(/-/g, '');
    const poolBytes = Buffer.from(cleanedPoolId, 'hex');
    const [poolPDA] = await PublicKey.findProgramAddressSync(
        [Buffer.from("pool"), poolBytes],
        program.programId
    );
    
    // Get the PDA for the predictions
    const predictionPDAs = predictors.map(predictor => {
        const [predictionPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("prediction"), poolPDA.toBuffer(), predictor.toBuffer()],
            program.programId
        );
        return {
            pubkey: predictionPDA,
            isWritable: true,
            isSigner: false,
        }
    });
    
    const poolTokenAccount = await getAssociatedTokenAddress(
        WSOL_MINT,
        poolPDA,
        true // allowOwnerOffCurve = true for PDAs
    );

    const prizeAmounts = prizes.map(prize => new BN(prize * LAMPORTS_PER_SOL)); // 0.001 SOL

    if (prizeAmounts.length !== predictionPDAs.length) {
        throw new Error("Mismatched prize count");
    }

    // Resolve the pool
    const tx = await program.methods
        .resolvePool(prizeAmounts, new BN(0))
        .accounts({
            pool: poolPDA,
            admin,
            poolTokenAccount: poolTokenAccount,
            wsolMint: WSOL_MINT,
        })
        .remainingAccounts(predictionPDAs)
        .transaction();

    console.log(`Transaction created! ${tx}`);
    return tx;
}