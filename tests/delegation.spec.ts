import { test } from "@playwright/test";
import {
  cleanupSharedContext,
  getSharedPage,
  setupSharedContext,
} from "./shared-context.ts";
import { goToTest, waitForSuccess } from "./helpers.ts";

test.describe("Delegation", () => {
  test.beforeAll(async () => {
    await cleanupSharedContext();
    await setupSharedContext();
  });

  test("should delegate to a baker", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Delegation" });
    await page.getByRole("button", { name: "Delegate" }).click();
    await waitForSuccess({ page });
  });

  test("should undelegate from a baker", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Delegation" });
    await page.getByRole("button", { name: "Remove Delegation" }).click();
    await waitForSuccess({ page });
  });

  test.afterAll(async () => {
    await cleanupSharedContext();
  });
});
