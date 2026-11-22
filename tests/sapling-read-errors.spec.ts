import { expect, test } from "@playwright/test";
import { goToTest } from "./helpers.ts";

// The page loads balances with a read-only toolkit as soon as its session keys
// exist, so this needs no wallet and no funds. The RPC answers every Sapling
// state read with 404.
test.describe("Sapling state read errors", () => {
  test("reports an unreadable Sapling state instead of an empty pool", async ({
    page,
  }) => {
    await page.route(/\/single_sapling_get_diff/, (route) =>
      route.fulfill({ status: 404, body: "Not found" }),
    );

    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Taquito Playground" }),
    ).toBeVisible();
    await goToTest({ page, testName: "Sapling Transactions" });

    await expect(
      page.getByText(
        /Failed to load Sapling balances or history: Couldn't read the Sapling state of KT1\w+ from \S+: single_sapling_get_diff answered HTTP 404/,
      ),
    ).toBeVisible({ timeout: 30000 });
    // The old fallback turned the 404 into an empty pool and showed a zero
    // balance. Now no balance is shown at all.
    await expect(page.getByTestId("sapling-user-balance")).toHaveCount(0);
  });
});
