import { expect, test } from "@playwright/test";
import { goToTest, waitForSuccess } from "./helpers.ts";
import { getSharedPage, setupSharedContext } from "./shared-context.ts";

test.describe("Global Constants", () => {
  test.beforeAll(async () => {
    await setupSharedContext();
  });

  test("should register a global constant", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Global Constants" });
    await page.getByRole("button", { name: "Generate Random" }).click();
    await expect(page.locator("#expression-input")).not.toHaveValue("", {
      timeout: 5000,
    });
    await page.getByRole("button", { name: "Register Constant" }).click();

    await waitForSuccess({ page });
  });
});
