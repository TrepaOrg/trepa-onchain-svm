import { BN, Program } from "@project-serum/anchor";
import { 
    Connection,
    LAMPORTS_PER_SOL, 
    PublicKey, 
    SystemProgram, 
    Transaction 
} from "@solana/web3.js";
import { Trepa } from "../../target/types/trepa";
import { 
    TOKEN_PROGRAM_ID, 
    getAssociatedTokenAddress, 
    createAssociatedTokenAccountInstruction,
    createSyncNativeInstruction
} from "@solana/spl-token";

// WSOL mint address (same on all networks)
const WSOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");

/**
 * Creates a new prediction.
 * @param program - The program instance.
 * @param connection - The connection instance.
 * @param wallet - The wallet instance.
 * @param poolId - The pool to be predicted. (16 bytes uuid)
 * @param prediction - The prediction to be made. [0, 100]
 * @param stake - The stake to be made with the prediction.
 */
export async function createPrediction(
    program: Program<Trepa>,
    connection: Connection, 
    wallet: PublicKey, 
    poolId: string, // 16 bytes uuid
    prediction: number,
    stake: number
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

    const tx = new Transaction();
    
    // Check if the predictor token account exists and create it if needed
    const predictorTokenAccountInfo = await connection.getAccountInfo(predictorTokenAccount);
    if (!predictorTokenAccountInfo) {
        console.log("Creating predictor token account");
        tx.add(
            createAssociatedTokenAccountInstruction(
                wallet,
                predictorTokenAccount,
                wallet,
                WSOL_MINT
            )
        );
    } else {
        console.log("Predictor token account exists");
    }

     // Check if the pool token account exists and create it if needed
     const poolTokenAccountInfo = await connection.getAccountInfo(poolTokenAccount);
     if (!poolTokenAccountInfo) {
         console.log("Creating pool token account");
         tx.add(
             createAssociatedTokenAccountInstruction(
                 wallet,
                 poolTokenAccount,
                 poolPDA,
                 WSOL_MINT
             )
         );
     } else {
         console.log("Pool token account exists");
     }

    // Transfer `stake` SOL from the wallet to the predictor's WSOL token account.
    tx.add(
        SystemProgram.transfer({
            fromPubkey: wallet,
            toPubkey: predictorTokenAccount,
            lamports: stake * LAMPORTS_PER_SOL,
        })
    );
    
    // Sync the native WSOL account to update its balance.
    tx.add(
        createSyncNativeInstruction(predictorTokenAccount, TOKEN_PROGRAM_ID)
    );
    
    tx.add(
        await program.methods
            .predict(prediction, new BN(stake * LAMPORTS_PER_SOL))
            .accounts({
                prediction: predictionPDA,
                pool: poolPDA,
                predictor: wallet,
                predictorTokenAccount: predictorTokenAccount,
                poolTokenAccount: poolTokenAccount,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                wsolMint: WSOL_MINT,
            })
            .instruction()
    );

    console.log(`Transaction created! ${tx}`);
    return tx;
}