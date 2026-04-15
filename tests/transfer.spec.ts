import { expect, test } from "@playwright/test";
import { goToTest, waitForSuccess } from "./helpers.ts";
import { getSharedPage, setupSharedContext } from "./shared-context.ts";

test.describe("Transfers", () => {
  test.beforeAll(async () => {
    await setupSharedContext();
  });

  test("should transfer tokens to another address", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Transfer Tez" });
    await page.getByRole("button", { name: "Send Transfer" }).click();
    await waitForSuccess({ page });
  });
});

test.describe("Transfer amount input", () => {
  test("should preserve fractional tez amounts in the amount field", async ({
    page,
  }) => {
    await page.goto("/");
    await goToTest({ page, testName: "Transfer Tez" });

    const amountInput = page.getByRole("spinbutton");
    await amountInput.fill("0.1");
    await expect(amountInput).toHaveValue("0.1");
  });
});
