import { test } from "@playwright/test";
import { goToTest, waitForSuccess } from "./helpers.ts";
import { getSharedPage, setupSharedContext } from "./shared-context.ts";

test.describe("Batch API", () => {
  test.beforeAll(async () => {
    await setupSharedContext();
  });

  test("should send a batch of operations", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Batch Operations" });
    await page.getByRole("button", { name: "Send Batch Operation" }).click();
    await waitForSuccess({ page });
  });
});
