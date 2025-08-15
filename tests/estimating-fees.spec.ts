import { test } from "@playwright/test";
import {
  cleanupSharedContext,
  getSharedPage,
  setupSharedContext,
} from "./shared-context.ts";
import { goToTest, waitForSuccess } from "./helpers.ts";

test.describe("Estimating Fees", () => {
  test.beforeAll(async () => {
    await cleanupSharedContext();
    await setupSharedContext();
  });

  test("should estimate fees for a transfer", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Estimating Fees" });
    await page.getByRole("button", { name: "Estimate Fees" }).click();
    await waitForSuccess({ page });
  });

  test.afterAll(async () => {
    await cleanupSharedContext();
  });
});
