import { test } from "@playwright/test";
import { goToTest, waitForSuccess } from "./helpers.ts";
import { getSharedPage, setupSharedContext } from "./shared-context.ts";

test.describe.configure({ mode: "serial" });

test.describe("Sapling Transactions", () => {
  test.beforeAll(async () => {
    await setupSharedContext();
  });

  test("should execute shield operation", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Sapling Transactions" });

    // Wait for keys to auto-generate on mount
    await page.waitForTimeout(2000);

    // Execute shield operation (10-30s for zero-knowledge proof)
    await page.getByTestId("sapling-shield-button").click();
    await waitForSuccess({ page, timeout: 90000 });
  });

  test("should transfer to Alice's address", async () => {
    const page = getSharedPage();

    // Execute private transfer (10-30s for zero-knowledge proof)
    await page.getByTestId("sapling-transfer-button").click();
    await waitForSuccess({ page, timeout: 90000 });
  });

  test("should unshield to user's tz1 address", async () => {
    const page = getSharedPage();

    // Execute unshield operation (10-30s for zero-knowledge proof)
    await page.getByTestId("sapling-unshield-button").click();
    await waitForSuccess({ page, timeout: 90000 });
  });

  test("should get transaction history", async () => {
    const page = getSharedPage();

    // Fetch transaction history (should be quick)
    await page.getByTestId("sapling-history-button").click();
    await page.waitForTimeout(5000);
  });

  test("should get user balance", async () => {
    const page = getSharedPage();

    // Fetch balance from shielded pool (should be quick)
    await page.getByTestId("sapling-balance-button").click();
    await page.waitForTimeout(5000);
  });
});
