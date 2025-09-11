import { test as setup } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

setup("create new private key", async ({}) => {
  console.log(
    `🔑 Creating new private key for ${process.env.VITE_NETWORK_TYPE}...`,
  );

  const response = await fetch(
    `https://keygen.ecadinfra.com/${process.env.VITE_NETWORK_TYPE}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer taquito-example",
      },
    },
  );

  if (response.status !== 200) {
    console.error(`Failed to create private key: ${response.statusText}`);
    throw new Error(`Failed to create private key: ${response.statusText}`);
  }

  const privateKey = await response.text();

  process.env.TEST_WALLET_PRIVATE_KEY = privateKey;
  console.log(
    `🔐 Private key created and saved for ${process.env.VITE_NETWORK_TYPE}`,
  );
});
