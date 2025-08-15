import { test } from "@playwright/test";
import { getSharedPage, setupSharedContext } from "./shared-context.ts";
import { goToTest, waitForSuccess } from "./helpers.ts";

test.describe("Transfers", () => {
  test.beforeAll(async () => {
    await setupSharedContext();
  });

  test("should transfer tokens to another address", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Transfer Tez Between Addresses" });
    await page.getByRole("button", { name: "Send Transfer" }).click();
    await waitForSuccess({ page });
  });
});
