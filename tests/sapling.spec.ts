import { test } from "@playwright/test";
import { goToTest, waitForSuccess } from "./helpers.ts";
import { getSharedPage, setupSharedContext } from "./shared-context.ts";

test.describe("Sapling: Private Transactions", () => {
  test.beforeAll(async () => {
    await setupSharedContext();
  });

  test("should deploy sapling contract", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Sapling: Private Transactions" });

    // Deploy contract
    await page.getByRole("button", { name: "Deploy Sapling Contract" }).click();

    // Wait for deployment to complete (30-60 seconds)
    await waitForSuccess({ page, timeout: 90000 });
  });

  test("should generate sapling keys", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Sapling: Private Transactions" });

    // Generate keys
    await page.getByRole("button", { name: "Generate Keys" }).click();

    // Keys should be generated quickly
    await waitForSuccess({ page, timeout: 10000 });
  });

  test("should run complete sapling workflow", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Sapling: Private Transactions" });

    // Click the "Run Complete Sapling Workflow" button
    await page
      .getByRole("button", { name: "Run Complete Sapling Workflow" })
      .click();

    // Wait for the complete workflow to finish
    // This includes: deploy, generate keys, shield, transfer, unshield
    // Total time: ~90-120 seconds on testnet
    await waitForSuccess({ page, timeout: 180000 });
  });
});
