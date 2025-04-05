import { getPredictionValueFromTx } from "./utils/getPredictionValue";
import * as anchor from "@project-serum/anchor";
import { getPredictionAccountData } from "./utils/getAccountsData";
import { Trepa } from "../target/types/trepa";
import { POOL_ID } from "./constants";

async function main() {
    // Set up the provider and program
    const provider = anchor.AnchorProvider.env();
    const connection = provider.connection;
    const program = anchor.workspace.Trepa as anchor.Program<Trepa>;

    const signature = "35W4iJma9R2Xa72tN89D6YxXRVkdSGvmCWQQjjrqWDmWvMvz7QVdNhdsTiQKmDfLZKWbTAtPREK9pq1RDfER5z2C";
    const predictionValue = await getPredictionValueFromTx(signature, connection);
    console.log("Prediction value from tx:", predictionValue);

    const poolId = POOL_ID;
    const predictionAccountData = await getPredictionAccountData(connection, provider.wallet.publicKey.toBase58(), poolId, program);
    console.log("Prediction account data:", predictionAccountData);
  }
  
  main()
    .then(() => console.log("Prediction value fetched successfully"))
    .catch((err) => {
      console.error("Error fetching prediction value:", err);
    });
  