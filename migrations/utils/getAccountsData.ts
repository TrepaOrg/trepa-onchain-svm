import { Connection, PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { Trepa } from "../../target/types/trepa";

/**
 * Fetches account data by its address.
 * @param connection - The connection to the Solana network.
 * @param accountAddress - The public key of the account to fetch data from.
 * @param program - Optional program instance for deserializing the account data.
 * @returns The account data or null if the account doesn't exist.
 */
// fix with prediction id
export async function getPredictionAccountData(
  connection: Connection,
  predictorAddress: string,
  poolId: string, 
  program: Program<Trepa>
): Promise<any> {

  const predictor = new PublicKey(predictorAddress);

  // Get the PDA for the pool
  const cleanedPoolId = poolId.replace(/-/g, '');
  const poolBytes = Buffer.from(cleanedPoolId, 'hex');
  const [poolPDA] = await PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), poolBytes],
      program.programId
  );
  console.log("Pool PDA:", poolPDA.toBase58());

  // Get the PDA for the prediction
  const [predictionPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("prediction"), poolPDA.toBuffer(), predictor.toBuffer()],
    program.programId
  );

  const accountInfo = await connection.getAccountInfo(predictionPDA);
    
  //console.log(`Account found with ${accountInfo.data.length} bytes of data`);

  const predictionData = program.coder.accounts.decode(
    "PredictionAccount",
    accountInfo.data
  );

  console.log("Prediction Data:", predictionData);
  console.log("Prize Value: ", predictionData.prize.toNumber(), " is claimed: ", predictionData.isClaimed);
  return predictionData;
}


// /**
//  * Fetches pool account data by its address.
//  * @param connection - The connection to the Solana network.
//  * @param poolAddress - The public key of the pool account.
//  * @param program - The program instance.
//  * @returns The pool account data or null if the account doesn't exist.
//  */
// export async function getPoolAccountData(
//   connection: Connection,
//   poolAddress: PublicKey | string,
//   program: Program<Trepa>
// ) {
//   return getAccountData(connection, poolAddress, program);
// }
