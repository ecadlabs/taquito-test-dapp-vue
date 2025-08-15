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

  test("should stake tez", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Staking Tokens" });
    await waitForBalanceLoaded({ page });

    const delegateAlert = await page.getByText(
      "You don't have a delegate set",
      { exact: false },
    );
    const isDelegateAlertVisible = await delegateAlert
      .isVisible()
      .catch(() => false);
    const isDelegateSet = !isDelegateAlertVisible;
    if (!isDelegateSet) {
      await delegate({ page });
    }

    await goToTest({ page, testName: "Staking Tokens" });

    await page.getByRole("button", { name: "Stake", exact: true }).click();
    await waitForSuccess({ page });
  });

  test("should unstake tez", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Staking Tokens" });

    await waitForBalanceLoaded({ page });

    await page.getByRole("button", { name: "Unstake", exact: true }).click();
    await waitForSuccess({ page });
  });

  test("should finalize unstake", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Staking Tokens" });

    await waitForBalanceLoaded({ page });

    await page.getByRole("button", { name: "Finalize Unstake" }).click();
    await waitForSuccess({ page });
  });
});
