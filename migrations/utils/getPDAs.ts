import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Trepa } from "../../target/types/trepa";

export async function getPoolPDAandIdArray(program: Program<Trepa>, poolId: string) {
    // Get the PDA for the pool
    const cleanedPoolId = poolId.replace(/-/g, '');
    const questionBytes = Buffer.from(cleanedPoolId, 'hex');
    if (questionBytes.length !== 16) {
        throw new Error(`Pool ID must be 16 bytes, not ${questionBytes.length} bytes for string ${questionBytes}`);
    }
    const [poolPDA] = await PublicKey.findProgramAddressSync(
        [Buffer.from("pool"), questionBytes],
        program.programId
    );
    return { poolPDA, questionBytes: Array.from(questionBytes) };
}

export async function getPredictionPDAandIdArray(program: Program<Trepa>, predictionId: string) {
    const cleanedPredictionId = predictionId.replace(/-/g, '');
    const predictionIdBytes = Buffer.from(cleanedPredictionId, 'hex');
    if (predictionIdBytes.length !== 16) {
        throw new Error(`Prediction ID must be 16 bytes, not ${predictionIdBytes.length} bytes for string ${predictionIdBytes}`);
    }
    const [predictionPDA] = await PublicKey.findProgramAddressSync(
        [Buffer.from("prediction"), predictionIdBytes],
        program.programId
    );
    return { predictionPDA, predictionIdBytes: Array.from(predictionIdBytes) };
}   