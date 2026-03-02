import { test } from "@playwright/test";
import { goToTest, waitForSuccess } from "./helpers.ts";
import { getSharedPage, setupSharedContext } from "./shared-context.ts";

const RPC_URL = process.env.VITE_RPC_URL || "https://ghostnet.ecadinfra.com";

async function getRandomBlockInLast10000(): Promise<number> {
  const response = await fetch(`${RPC_URL}/chains/main/blocks/head/header`);
  const header = await response.json();
  const latestBlock = header.level as number;
  const minBlock = Math.max(1, latestBlock - 10000);
  return Math.floor(Math.random() * (latestBlock - minBlock + 1)) + minBlock;
}

test.describe("Viewing Blocks", () => {
  test.beforeAll(async () => {
    await setupSharedContext();
  });

  test("should fetch a random block and display transactions", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Viewing Blocks" });

    // Get a random block number from the last 10,000 blocks
    const blockNumber = await getRandomBlockInLast10000();

    // Enter the block number
    await page.getByRole("spinbutton").fill(blockNumber.toString());
    await page.getByRole("button", { name: "Fetch" }).click();
    await waitForSuccess({ page });

    // Verify the block transactions card is displayed
    await page.getByText(`Block ${blockNumber} Transactions`).waitFor();

    // Verify transaction count is displayed
    await page.getByTestId("transaction-count").waitFor();
  });
});
