import { test } from "@playwright/test";
import { getSharedPage, setupSharedContext } from "./shared-context.ts";
import { goToTest, waitForSuccess } from "./helpers.ts";

test.describe("Failing Noop", () => {
  test.beforeAll(async () => {
    await setupSharedContext();
  });

  test("should create a failing noop", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Failing Noop" });
    await page.getByRole("button", { name: "Fail Noop" }).click();
    await waitForSuccess({ page });
  });
});
