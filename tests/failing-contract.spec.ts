import { test, expect } from "@playwright/test";
import { getSharedPage, setupSharedContext } from "./shared-context.ts";
import { goToTest, waitForSuccess, waitForError } from "./helpers.ts";

test.describe("Contract Call Failures", () => {
  test.beforeAll(async () => {
    await setupSharedContext();
  });

  test("should handle wrong parameter type error", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Contract Call Failures" });

    await page.getByRole("button", { name: "Wrong Type" }).click();

    // The operation should fail and display error information
    await waitForError({ page });

    // Verify error message is displayed
    await expect(page.getByText("Error Details")).toBeVisible();
    await expect(page.getByText("This error was expected")).toBeVisible();
  });

  test("should handle invalid entrypoint error", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Contract Call Failures" });

    await page.getByRole("button", { name: "Invalid Entrypoint" }).click();

    // The operation should fail and display error information
    await waitForError({ page });

    // Verify error message is displayed
    await expect(page.getByText("Error Details")).toBeVisible();
    await expect(page.getByText("This error was expected")).toBeVisible();
  });

  test("should handle invalid parameter structure error", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Contract Call Failures" });

    await page.getByRole("button", { name: "Invalid Structure" }).click();

    // The operation should fail and display error information
    await waitForError({ page });

    // Verify error message is displayed
    await expect(page.getByText("Error Details")).toBeVisible();
    await expect(page.getByText("This error was expected")).toBeVisible();
  });
});
