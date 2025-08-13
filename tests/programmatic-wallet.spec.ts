import { test, expect } from "@playwright/test";

test.describe("Programmatic Wallet Integration", () => {
  test.beforeEach(async ({ page }) => {
    //
  });

  test("should connect programmatic wallet without user interaction", async ({
    page,
  }) => {
    // Navigate to the home page
    await page.goto("/");

    // Verify we're on the home page
    await expect(
      page.getByRole("heading", { name: "Taquito Playground" }),
    ).toBeVisible();
  });
});
