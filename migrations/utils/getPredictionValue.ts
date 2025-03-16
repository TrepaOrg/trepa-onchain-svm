import { Connection } from "@solana/web3.js";

/**
 * Fetches transaction details given a transaction signature.
 * @param signature - The transaction signature.
 * @param connection - The connection to the Solana network.
 * @returns The transaction details.
 */
export async function getPredictionValue(signature: string, connection: Connection): Promise<bigint> {

    const transactionData = await connection.getParsedTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
    });

    if (!transactionData || !transactionData.meta) {
        console.log("Transaction not found or missing metadata.");
        return null;
    }

    console.log("Transaction Data:");
    console.log(JSON.stringify(transactionData, null, 2));

    // Ensure inner instructions exist.
    if (!transactionData.meta.innerInstructions || transactionData.meta.innerInstructions.length === 0) {
        console.log("No inner instructions found. Check if singature is valid or if transaction is not yet confirmed.");
        return null;
    }

    // Loop over inner instructions to find one with type "transfer".
    let transferInstruction = null;

    transferInstruction = transactionData.meta.innerInstructions[0].instructions.find((instruction) => {
      if ("parsed" in instruction) {
        return instruction.parsed.type === "transfer";
      }
      return false;
    });

  if (!transferInstruction) {
    console.log("No transfer instruction found in inner instructions.");
    return null;
  }

  // Return the lamports field from the transfer instruction.
  const lamports = transferInstruction.parsed.info.lamports;
  return lamports;
}