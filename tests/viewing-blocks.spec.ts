import { test } from "@playwright/test";
import { goToTest, waitForSuccess } from "./helpers.ts";
import { getSharedPage, setupSharedContext } from "./shared-context.ts";

test.describe("Viewing Blocks", () => {
  test.beforeAll(async () => {
    await setupSharedContext();
  });

  test("should fetch block 15,831,729 and display transactions", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Viewing Blocks" });

    // Enter the specific block number
    await page.getByRole("spinbutton").fill("15831729");
    await page.getByRole("button", { name: "Fetch" }).click();
    await waitForSuccess({ page });

    // Verify the block transactions card is displayed
    await page.getByText("Block 15831729 Transactions").waitFor();

    // Verify transaction count is displayed
    await page.getByTestId("transaction-count").waitFor();

    // Verify transaction details are shown
    await page.getByText("Transaction 1").waitFor();
    await page.getByText("Fee:").waitFor();
  });
});
