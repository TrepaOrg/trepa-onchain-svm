
import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, Connection } from "@solana/web3.js";

/**
 * Creates a batch transfer transaction.
 * @param provider - The provider instance.
 * @param recipients - The recipients of the transfer.
 * @param amount - The amount of SOL to transfer.
 */
export async function createBatchTransfer(
    wallet: PublicKey,
    connection: Connection,
    recipients: PublicKey[],
    amounts: number[]
) {
    if (recipients.length !== amounts.length) {
        throw new Error("Recipients and amounts arrays must have the same length");
    }
    const transaction = new Transaction();
    recipients.forEach((recipient, index) => {
        const instruction = SystemProgram.transfer({
        fromPubkey: wallet,
        toPubkey: recipient,
        lamports: amounts[index] * LAMPORTS_PER_SOL,
    });
        transaction.add(instruction);
    });

    // Assign fee payer and a recent blockhash
    transaction.feePayer = wallet;
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    return transaction;
}
