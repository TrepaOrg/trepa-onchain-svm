import { getPredictionValue } from "./utils/getPredictionValue";
import * as anchor from "@project-serum/anchor";

async function main() {
    // Set up the provider and program
    const provider = anchor.AnchorProvider.env();
    const connection = provider.connection;

    const signature = "4kAhCQqEJdxNBr9K9gmZdYArPzw6eXywQ7EPxQ4GM9zgMDBYC2Us6UN9dVeNbDcjqHX1vceKWMZZKZSUaa9MvNpm";
    const predictionValue = await getPredictionValue(signature, connection);
    console.log("Prediction value:", predictionValue);
  }
  
  main()
    .then(() => console.log("Prediction value fetched successfully"))
    .catch((err) => {
      console.error("Error fetching prediction value:", err);
    });
  