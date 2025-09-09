import { test, expect } from "@playwright/test";
import { getSharedPage, setupSharedContext } from "./shared-context.ts";
import { goToTest, waitForSuccess } from "./helpers.ts";

test.describe("TZIP-16 Contract Metadata", () => {
  test.beforeAll(async () => {
    await setupSharedContext();
  });

  test("should retrieve metadata from metadata contract", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "TZIP-16 Contract Metadata" });

    await page.getByTestId("get-metadata-button").click();
    await waitForSuccess({ page });

    await expect(
      page.locator("text=Metadata Example Contract").first(),
    ).toBeVisible();
    await expect(page.locator("text=ECAD Labs").first()).toBeVisible();
    await expect(page.locator("text=TZIP-16").first()).toBeVisible();
  });

  test("should execute contract view successfully", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "TZIP-16 Contract Metadata" });

    await page.getByTestId("get-metadata-button").click();
    await waitForSuccess({ page });

    await page.locator('button:has-text("Execute")').first().click();

    await expect(page.locator("text=Hello, World")).toBeVisible();
  });
});
