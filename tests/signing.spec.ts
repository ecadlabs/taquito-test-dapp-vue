import { test } from "@playwright/test";
import { getSharedPage, setupSharedContext } from "./shared-context.ts";
import { goToTest, waitForSuccess } from "./helpers.ts";

test.describe("Signing Payloads", () => {
  test.beforeAll(async () => {
    await setupSharedContext();
  });

  test("should sign a payload", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Signing Data" });
    await page.getByTestId("string-payload-input").fill("Hello, world!");
    await page.getByTestId("sign-payload-button").click();
    await waitForSuccess({ page });
  });

  test("should sign a tzip32 payload", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Signing Data" });
    await page.getByTestId("string-payload-input").fill("Hello, world!");
    await page.getByTestId("sign-tzip32-payload-button").click();
    await waitForSuccess({ page });
  });
});
