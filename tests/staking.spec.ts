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
    await goToTest({ page: sharedPage, testName: "Staking Tokens" });
    await waitForBalanceLoaded({ page: sharedPage });

    // Check if delegate is set and wait for it to be properly established
    const delegateAlert = await sharedPage.getByText(
      "You don't have a delegate set",
      { exact: false },
    );

    let isDelegateSet = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (!isDelegateSet && attempts < maxAttempts) {
      const isDelegateAlertVisible = await delegateAlert
        .isVisible()
        .catch(() => false);

      isDelegateSet = !isDelegateAlertVisible;

      if (!isDelegateSet) {
        console.log(`Attempt ${attempts + 1}: Setting delegate...`);
        await delegate({ page: sharedPage });

        // Wait longer for delegation to be properly established
        await sharedPage.waitForTimeout(5000);

        // Refresh the page to ensure delegation state is updated
        await sharedPage.reload();
        await goToTest({ page: sharedPage, testName: "Staking Tokens" });
        await waitForBalanceLoaded({ page: sharedPage });
      }

      attempts++;
    }

    if (!isDelegateSet) {
      throw new Error("Failed to set delegate after multiple attempts");
    }

    // Additional wait to ensure delegation is fully processed
    await sharedPage.waitForTimeout(3000);

    await goToTest({ page: sharedPage, testName: "Staking Tokens" });
    await waitForBalanceLoaded({ page: sharedPage });

    // Wait for the stake button to be enabled
    const stakeButton = sharedPage.getByRole("button", {
      name: "Stake",
      exact: true,
    });
    await sharedPage.waitForFunction(
      () => {
        const button =
          document.querySelector('button[data-testid="stake-button"]') ||
          document.querySelector('button:has-text("Stake")');
        return button && !button.hasAttribute("disabled");
      },
      { timeout: 30000 },
    );

    await stakeButton.click();
    await waitForSuccess({ page: sharedPage });

    // Wait for balance to update after staking
    await sharedPage.waitForTimeout(2000);
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
