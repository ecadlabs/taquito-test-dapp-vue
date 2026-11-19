import { expect, test } from "@playwright/test";
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

    await expect(page.getByTestId("sapling-runtime-module-status")).toHaveText(
      "Sapling module ready",
      { timeout: 15000 },
    );
    await expect(page.getByTestId("sapling-runtime-params-status")).toHaveText(
      "Proving params not loaded",
    );

    // Execute shield operation (10-30s for zero-knowledge proof)
    await page.getByTestId("sapling-shield-button").click();
    await waitForSuccess({ page, timeout: 90000 });
    await expect(page.getByTestId("sapling-runtime-params-status")).toHaveText(
      "Proving params ready",
    );
  });

  test("should transfer to Alice's address", async () => {
    const page = getSharedPage();

    // Execute private transfer (10-30s for zero-knowledge proof)
    await page.getByTestId("sapling-transfer-button").click();
    await waitForSuccess({ page, timeout: 90000 });
  });

  test("should unshield to user's public address", async () => {
    const page = getSharedPage();

    // Execute unshield operation (10-30s for zero-knowledge proof)
    await page.getByTestId("sapling-unshield-button").click();
    await waitForSuccess({ page, timeout: 90000 });
  });

  test("should get transaction history", async () => {
    const page = getSharedPage();

    // Fetch transaction history and verify notes and transfers render
    await page.getByTestId("sapling-history-button").click();
    await expect(page.getByTestId("sapling-history-total")).toHaveText("4", {
      timeout: 30000,
    });
    await expect(page.getByTestId("sapling-history-list")).toBeVisible();
  });

  test("should get user balance", async () => {
    const page = getSharedPage();

    // Fetch balances from shielded pool and verify user and Alice balances
    await page.getByTestId("sapling-balance-button").click();
    await expect(page.getByTestId("sapling-user-balance")).toHaveText(
      "1.000000 ꜩ",
      { timeout: 30000 },
    );
    await expect(page.getByTestId("sapling-alice-balance")).toHaveText(
      "1.000000 ꜩ",
      { timeout: 30000 },
    );
  });

  // One account builds and submits here. This checks the build-then-submit
  // flow and the applied result, not a real wallet account switch.
  test("should build a transfer and submit it separately", async () => {
    const page = getSharedPage();

    // Prove the transfer without sending it, then submit the built transaction.
    await page.getByTestId("sapling-tab-transfer").click();
    await page.getByTestId("sapling-transfer-build-button").click();
    await expect(page.getByTestId("sapling-built-transfer")).toHaveAttribute(
      "data-state",
      "prepared",
      { timeout: 90000 },
    );
    await page.getByTestId("sapling-transfer-submit-built-button").click();
    await waitForSuccess({ page, timeout: 90000 });
    await expect(page.getByTestId("sapling-built-transfer")).toBeHidden();

    await page.getByTestId("sapling-balance-button").click();
    await expect(page.getByTestId("sapling-user-balance")).toHaveText(
      "0.000000 ꜩ",
      { timeout: 30000 },
    );
    await expect(page.getByTestId("sapling-alice-balance")).toHaveText(
      "2.000000 ꜩ",
      { timeout: 30000 },
    );
  });
});
