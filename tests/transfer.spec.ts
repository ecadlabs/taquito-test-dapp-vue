import { test } from "@playwright/test";
import {
  cleanupSharedContext,
  getSharedPage,
  setupSharedContext,
} from "./shared-context.ts";
import { goToTest, waitForSuccess } from "./helpers.ts";

test.describe("Transfers", () => {
  test.beforeEach(async () => {
    await cleanupSharedContext();
    await setupSharedContext();
  });

  test("should transfer tokens to another address", async () => {
    console.log("Running transfer test");
    const page = getSharedPage();
    await goToTest({ page, testName: "Transfer Tez Between Addresses" });
    await page.waitForTimeout(1000);
    await page.getByRole("button", { name: "Send Transfer" }).click();
    await waitForSuccess({ page });
  });

  test.afterAll(async () => {
    await cleanupSharedContext();
  });
});
