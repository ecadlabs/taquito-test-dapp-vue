import { test } from "@playwright/test";
import { goToTest, waitForSuccess } from "./helpers.ts";
import { getSharedPage, setupSharedContext } from "./shared-context.ts";

test.describe("Sapling: Private Transactions", () => {
  test.beforeAll(async () => {
    await setupSharedContext();
  });

  test("should run complete sapling workflow in simulation mode", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Sapling: Private Transactions" });

    // Click the "Run Complete Sapling Workflow" button
    await page
      .getByRole("button", { name: "Run Complete Sapling Workflow" })
      .click();

    // Wait for the simulation workflow to complete successfully
    // Note: Simulation mode completes in ~6 seconds
    // Real blockchain execution (Phase 2) would take 40-95 seconds
    await waitForSuccess({ page, timeout: 15000 });
  });
});
