import { test } from "@playwright/test";
import { goToTest, waitForSuccess } from "./helpers.ts";
import { getSharedPage, setupSharedContext } from "./shared-context.ts";

test.describe("Transaction Limits", () => {
  test.beforeAll(async () => {
    await setupSharedContext();
  });

  test("should set transaction limits for a contract interaction", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Transaction Limits" });
    await page.getByRole("button", { name: "Interact with Contract" }).click();
    await waitForSuccess({ page });
  });
});
