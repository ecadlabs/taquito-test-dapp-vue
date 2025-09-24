import { test } from "@playwright/test";
import { goToTest, waitForSuccess } from "./helpers.ts";
import { getSharedPage, setupSharedContext } from "./shared-context.ts";

test.describe("Counter Smart Contract", () => {
  test.beforeAll(async () => {
    await setupSharedContext();
  });

  test("should get counter value", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Counter Smart Contract" });
    await page.getByRole("button", { name: "Get Storage Value" }).click();
    await waitForSuccess({ page });
  });

  test("should increment counter", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Counter Smart Contract" });
    await page.getByRole("button", { name: "Increment" }).click();
    await waitForSuccess({ page });
  });

  test("should decrement counter", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Counter Smart Contract" });
    await page.getByRole("button", { name: "Decrement" }).click();
    await waitForSuccess({ page });
  });

  test("should reset counter", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Counter Smart Contract" });
    await page.getByRole("button", { name: "Reset" }).click();
    await waitForSuccess({ page });
  });
});
