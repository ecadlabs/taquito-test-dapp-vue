import { Page, test } from "@playwright/test";
import { getSharedPage, setupSharedContext } from "./shared-context.ts";
import { delegate, goToTest, waitForSuccess } from "./helpers.ts";

test.describe("Delegation", () => {
  test.beforeAll(async () => {
    await setupSharedContext();
  });

  test("should delegate to a baker", async () => {
    const page = getSharedPage();
    await delegate({ page });
  });

  test("should undelegate from a baker", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Delegation" });
    await page.waitForTimeout(1000);
    await page.getByRole("button", { name: "Remove Delegation" }).click();
    await waitForSuccess({ page });
  });
});
