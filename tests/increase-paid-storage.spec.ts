import { test } from "@playwright/test";
import {
  cleanupSharedContext,
  getSharedPage,
  setupSharedContext,
} from "./shared-context.ts";
import { goToTest, waitForSuccess } from "./helpers.ts";

test.describe("Increasing Paid Storage", () => {
  test.beforeAll(async () => {
    await cleanupSharedContext();
    await setupSharedContext();
  });

  test("should increase paid storage", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Increasing Paid Storage" });
    await page.getByRole("button", { name: "Increase Storage" }).click();
    await waitForSuccess({ page });
  });

  test.afterAll(async () => {
    await cleanupSharedContext();
  });
});
