import { test } from "@playwright/test";
import { goToTest, waitForSuccess } from "./helpers.ts";
import { getSharedPage, setupSharedContext } from "./shared-context.ts";

test.describe("Sapling: Shield Operation", () => {
  test.beforeAll(async () => {
    await setupSharedContext();
  });

  test("should deploy sapling contract", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Sapling: Shield Operation" });

    // Deploy contract
    await page.getByRole("button", { name: "Deploy Sapling Contract" }).click();

    // Wait for deployment to complete
    await waitForSuccess({ page, timeout: 90000 });
  });

  test("should generate sapling keys", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Sapling: Shield Operation" });

    // Generate keys
    await page.getByRole("button", { name: "Generate Keys" }).click();

    // Keys should be generated quickly
    await waitForSuccess({ page, timeout: 10000 });
  });

  test("should execute shield operation with real proof generation", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Sapling: Shield Operation" });

    // Click the Shield button
    await page.getByRole("button", { name: "Shield" }).click();

    // Wait for shield operation to complete
    // This includes real zero-knowledge proof generation (10-30s)
    await waitForSuccess({ page, timeout: 90000 });
  });
});
