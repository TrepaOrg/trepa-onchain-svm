import { getPredictionValueFromTx } from "./utils/getPredictionValue";
import * as anchor from "@project-serum/anchor";
import { getPredictionAccountData } from "./utils/getAccountsData";
import { Trepa } from "../target/types/trepa";

async function main() {
    // Set up the provider and program
    const provider = anchor.AnchorProvider.env();
    const connection = provider.connection;
    const program = anchor.workspace.Trepa as anchor.Program<Trepa>;

    const signature = "4kAhCQqEJdxNBr9K9gmZdYArPzw6eXywQ7EPxQ4GM9zgMDBYC2Us6UN9dVeNbDcjqHX1vceKWMZZKZSUaa9MvNpm";
    const predictionValue = await getPredictionValueFromTx(signature, connection);
    console.log("Prediction value from tx:", predictionValue);

    const poolId = "b9cdc74e-c59a-4dbc-8006-c3e326040815";
    const predictionAccountData = await getPredictionAccountData(connection, provider.wallet.publicKey.toBase58(), poolId, program);
    console.log("Prediction account data:", predictionAccountData);
  }
  
  main()
    .then(() => console.log("Prediction value fetched successfully"))
    .catch((err) => {
      console.error("Error fetching prediction value:", err);
    });
  