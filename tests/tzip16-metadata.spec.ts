import { expect, test } from "@playwright/test";
import { goToTest, waitForSuccess } from "./helpers.ts";
import { getSharedPage, setupSharedContext } from "./shared-context.ts";

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
});
