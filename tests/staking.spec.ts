import { test } from "@playwright/test";
import {
  cleanupSharedContext,
  getSharedPage,
  setupSharedContext,
} from "./shared-context.ts";
import { goToTest, waitForSuccess } from "./helpers.ts";

test.describe("Staking", () => {
  test.beforeAll(async () => {
    await cleanupSharedContext();
    await setupSharedContext();
  });

  test("should stake tez", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Staking Tokens" });

    const delegateAlert = await page.getByText(
      "You don't have a delegate set",
      { exact: false },
    );
    const isDelegateAlertVisible = await delegateAlert
      .isVisible()
      .catch(() => false);
    const isDelegateSet = !isDelegateAlertVisible;
    if (!isDelegateSet) {
      await goToTest({ page, testName: "Delegation" });
      await page.getByRole("button", { name: "Delegate" }).click();
      await waitForSuccess({ page });
    }

    await goToTest({ page, testName: "Staking Tokens" });
    await page.waitForSelector("text=0");
    await page.getByRole("button", { name: "Stake", exact: true }).click();
    await waitForSuccess({ page });
  });

  test("should unstake tez", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Staking Tokens" });
    await page.waitForSelector("text=0");
    await page.getByRole("button", { name: "Unstake" }).click();
    await waitForSuccess({ page });
  });

  test("should finalize unstake", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Staking Tokens" });
    await page.waitForSelector("text=0");
    await page.getByRole("button", { name: "Finalize Unstake" }).click();
    await waitForSuccess({ page });
  });

  test.afterAll(async () => {
    await cleanupSharedContext();
  });
});
