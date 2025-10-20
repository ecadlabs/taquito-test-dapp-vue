import { test } from "@playwright/test";
import { delegate, goToTest, waitForSuccess } from "./helpers.ts";
import { getSharedPage, setupSharedContext } from "./shared-context.ts";

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
    await delegate({ page });
    await goToTest({ page, testName: "Delegation" });
    const removeDelegationButton = page.getByRole("button", {
      name: "Remove Delegation",
    });
    await removeDelegationButton.waitFor({ state: "visible" });
    await removeDelegationButton.click();
    await waitForSuccess({ page });
  });
});
