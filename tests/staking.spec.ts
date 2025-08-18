import { test } from "@playwright/test";
import { getSharedPage, setupSharedContext } from "./shared-context.ts";
import {
  goToTest,
  waitForSuccess,
  waitForBalanceLoaded,
  delegate,
} from "./helpers.ts";

test.describe("Staking", () => {
  test.beforeAll(async () => {
    await setupSharedContext();
  });

  test("should stake tez", async ({ page }) => {
    const sharedPage = getSharedPage();
    await delegate({ page: sharedPage });
    await sharedPage.waitForTimeout(2000);
    await goToTest({ page: sharedPage, testName: "Staking Tokens" });
    await waitForBalanceLoaded({ page: sharedPage });

    const stakeButton = sharedPage.getByRole("button", {
      name: "Stake",
      exact: true,
    });

    await stakeButton.click();
    await waitForSuccess({ page: sharedPage });
  });

  test("should unstake tez", async ({ page }) => {
    const sharedPage = getSharedPage();
    await goToTest({ page: sharedPage, testName: "Staking Tokens" });

    await waitForBalanceLoaded({ page: sharedPage });

    // Wait for the unstake button to be enabled
    const unstakeButton = sharedPage.getByRole("button", {
      name: "Unstake",
      exact: true,
    });
    await sharedPage.waitForFunction(
      () => {
        const button =
          document.querySelector('button[data-testid="unstake-button"]') ||
          document.querySelector('button:has-text("Unstake")');
        return button && !button.hasAttribute("disabled");
      },
      { timeout: 30000 },
    );

    await unstakeButton.click();
    await waitForSuccess({ page: sharedPage });

    // Wait for balance to update after unstaking
    await sharedPage.waitForTimeout(2000);
  });

  test("should finalize unstake", async ({ page }) => {
    const sharedPage = getSharedPage();
    await goToTest({ page: sharedPage, testName: "Staking Tokens" });

    await waitForBalanceLoaded({ page: sharedPage });

    // Wait for the finalize button to be enabled
    const finalizeButton = sharedPage.getByRole("button", {
      name: "Finalize Unstake",
    });
    await sharedPage.waitForFunction(
      () => {
        const button =
          document.querySelector('button[data-testid="finalize-button"]') ||
          document.querySelector('button:has-text("Finalize Unstake")');
        return button && !button.hasAttribute("disabled");
      },
      { timeout: 30000 },
    );

    await finalizeButton.click();
    await waitForSuccess({ page: sharedPage });

    // Wait for balance to update after finalizing
    await sharedPage.waitForTimeout(2000);
  });
});
