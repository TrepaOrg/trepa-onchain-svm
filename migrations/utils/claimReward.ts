import { BN, Program } from "@project-serum/anchor";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { Trepa } from "../../target/types/trepa";
import { 
    TOKEN_PROGRAM_ID, 
    getAssociatedTokenAddress, 
    createAssociatedTokenAccountInstruction,
    createCloseAccountInstruction
} from "@solana/spl-token";

// WSOL mint address (same on all networks)
const WSOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");

/**
 * Claims rewards for a prediction.
 * @param program - The program instance.
 * @param wallet - The wallet instance of the user.
 * @param poolId - The pool ID. (16 bytes uuid)
 */
export async function claimReward(
    program: Program<Trepa>, 
    wallet: PublicKey, 
    poolId: string, 
): Promise<Transaction> {
    
    console.log("Program ID:", program.programId.toBase58());

    // Get the PDA for the pool
    const cleanedPoolId = poolId.replace(/-/g, '');
    const poolBytes = Buffer.from(cleanedPoolId, 'hex');
    const [poolPDA] = await PublicKey.findProgramAddressSync(
        [Buffer.from("pool"), poolBytes],
        program.programId
    );
    console.log("Pool PDA:", poolPDA.toBase58());

    // Get the PDA for the prediction       
    const [predictionPDA] = await PublicKey.findProgramAddressSync(
        [Buffer.from("prediction"), poolPDA.toBuffer(), wallet.toBuffer()],
        program.programId
    );
    console.log("Prediction PDA:", predictionPDA.toBase58());

    // Get associated token accounts for WSOL
    const predictorTokenAccount = await getAssociatedTokenAddress(
        WSOL_MINT,
        wallet
    );
    
    const poolTokenAccount = await getAssociatedTokenAddress(
        WSOL_MINT,
        poolPDA,
        true // allowOwnerOffCurve = true for PDAs
    );
    if (!poolTokenAccount) {
        throw new Error("Pool token account not found");
    }

    // Create the transaction
    const tx = new Transaction();
    
    // Check if the predictor token account exists and create it if needed
    try {
        await program.provider.connection.getAccountInfo(predictorTokenAccount);
        console.log("Predictor token account exists");
    } catch (thrownObject) {
        console.log("Creating predictor token account");
        tx.add(
            createAssociatedTokenAccountInstruction(
                wallet,
                predictorTokenAccount,
                wallet,
                WSOL_MINT
            )
        );
    }

    // Add the claim rewards instruction
    tx.add(
        await program.methods
            .claimRewards()
            .accounts({
                prediction: predictionPDA,
                pool: poolPDA,
                predictor: wallet,
                predictorTokenAccount: predictorTokenAccount,
                poolTokenAccount: poolTokenAccount,
                wsolMint: WSOL_MINT,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .instruction()
    );

    // Add an extra instruction to close the predictor's WSOL token account
    // so that its WSOL is unwrapped (native SOL is returned to the wallet)
    tx.add(
        createCloseAccountInstruction(
            predictorTokenAccount,
            wallet,
            wallet,
            []
        )
    );

    console.log(`Transaction created!`);
    return tx;
}