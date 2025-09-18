import { test, expect } from "@playwright/test";
import { getSharedPage, setupSharedContext } from "./shared-context.ts";
import { goToTest, waitForSuccess } from "./helpers.ts";

test.describe.serial("FA2 Token (TZIP-12)", () => {
  test.beforeAll(async () => {
    await setupSharedContext();
  });

  test("should mint tokens to user address", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "FA2 Token (TZIP-12)" });

    await page.fill('[data-testid="mint-amount"]', "1000000");

    // Execute mint operation
    await page.getByRole("button", { name: "Mint Tokens" }).click();
    await waitForSuccess({ page });
  });

  test("should query token balance directly", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "FA2 Token (TZIP-12)" });

    // Execute balance query
    await page.getByRole("button", { name: "Query Balance (Direct)" }).click();
    await waitForSuccess({ page });

    // Verify balance is displayed
    await expect(page.getByText("Balance Results:")).toBeVisible();
    await expect(page.locator("text=/Balance: [0-9.,]/")).toBeVisible();
  });

  test("should query token balance with callback", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "FA2 Token (TZIP-12)" });

    // Execute balance query
    await page
      .getByRole("button", { name: "Query Balance (Callback)" })
      .click();
    await waitForSuccess({ page });

    // Verify balance is displayed
    await expect(page.getByText("Balance Results:")).toBeVisible();
    await expect(page.locator("text=/Balance: [0-9.,]/")).toBeVisible();
  });

  test("should transfer tokens to self", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "FA2 Token (TZIP-12)" });

    await page.fill('[data-testid="transfer-amount"]', "5000");

    // Execute transfer
    await page.getByRole("button", { name: "Transfer Tokens" }).click();
    await waitForSuccess({ page });
  });

  test("should burn tokens from user address", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "FA2 Token (TZIP-12)" });

    await page.fill('[data-testid="burn-amount"]', "5000");

    // Execute burn operation
    await page.getByRole("button", { name: "Burn Tokens" }).click();
    await waitForSuccess({ page });
  });
});
