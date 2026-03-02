import { expect, test } from "@playwright/test";
import { goToTest, waitForSuccess } from "./helpers.ts";
import { getSharedPage, setupSharedContext } from "./shared-context.ts";

test.describe("Contract Views", () => {
  test.beforeAll(async () => {
    await setupSharedContext();
  });

  test("should execute contract view successfully", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Contract Views" });

    await page.getByTestId("get-metadata-button").click();
    await waitForSuccess({ page });

    // Wait for the view options to appear
    await page
      .locator('button:has-text("Execute")')
      .first()
      .waitFor({ state: "visible" });
    await page.locator('button:has-text("Execute")').first().click();

    // Wait for the view result to appear
    await page.locator("text=Hello, World").waitFor({ state: "visible" });
    await expect(page.locator("text=Hello, World")).toBeVisible();
  });
});
