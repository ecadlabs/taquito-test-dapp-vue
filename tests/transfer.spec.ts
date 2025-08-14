import { test } from "@playwright/test";

test.describe("Transfers", () => {
  test("should transfer tokens to another address", async ({ page }) => {
    await page.goto("/tests/transfer");
    await page.getByRole("button", { name: "Send Transfer" }).click();
  });
});
