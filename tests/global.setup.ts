import { test as setup } from "@playwright/test";

setup("create new private key", async ({}) => {
  console.log("creating new private key...");

  const response = await fetch("https://keygen.ecadinfra.com/seoulnet", {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer taquito-example",
    },
  });

  const privateKey = await response.text();

  process.env.TEST_WALLET_PRIVATE_KEY = privateKey;

  console.log("private key:", privateKey);
});
