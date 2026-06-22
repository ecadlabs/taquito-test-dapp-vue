import { test as setup } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

setup("create new private key", async ({}) => {
  const existingPrivateKey =
    process.env.TEST_WALLET_PRIVATE_KEY ?? process.env.WALLET_PRIVATE_KEY;
  if (existingPrivateKey) {
    process.env.TEST_WALLET_PRIVATE_KEY = existingPrivateKey;
    console.log(
      `Using provided private key for ${process.env.VITE_NETWORK_TYPE}`,
    );
    return;
  }

  const keygenUrl = process.env.TEST_KEYGEN_URL;
  if (!keygenUrl) {
    throw new Error(
      "Set TEST_WALLET_PRIVATE_KEY or WALLET_PRIVATE_KEY before running Playwright tests. TEST_KEYGEN_URL can be set when a disposable key service is available.",
    );
  }

  console.log(
    `Creating new private key for ${process.env.VITE_NETWORK_TYPE}...`,
  );

  const keyUrl = new URL(
    process.env.VITE_NETWORK_TYPE ?? "",
    keygenUrl.endsWith("/") ? keygenUrl : `${keygenUrl}/`,
  );

  const response = await fetch(keyUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer taquito-example",
    },
  });

  if (response.status !== 200) {
    console.error(`Failed to create private key: ${response.statusText}`);
    throw new Error(`Failed to create private key: ${response.statusText}`);
  }

  const privateKey = await response.text();

  process.env.TEST_WALLET_PRIVATE_KEY = privateKey;
  console.log(
    `Private key created and saved for ${process.env.VITE_NETWORK_TYPE}`,
  );
});
