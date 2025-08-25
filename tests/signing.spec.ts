import { test } from "@playwright/test";
import { getSharedPage, setupSharedContext } from "./shared-context.ts";
import { goToTest, waitForSuccess } from "./helpers.ts";

test.describe("Signing Payloads", () => {
  test.beforeAll(async () => {
    await setupSharedContext();
  });

  let signature: string;

  test("should sign a payload", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Sign and Verify Payloads" });
    await page.getByTestId("string-payload-input").fill("Hello, world!");
    await page.getByTestId("sign-payload-button").click();
    await waitForSuccess({ page });

    const signatureText = await page
      .getByTestId("signature-output")
      .textContent();
    if (signatureText) {
      signature = signatureText;
    }
  });

  test("should verify a payload", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Sign and Verify Payloads" });
    await page.getByTestId("contract-signature-input").fill(signature);
    await page.getByTestId("contract-payload-input").fill("Hello, world!");
    await page.getByTestId("verify-payload-button").click();
    await waitForSuccess({ page });
  });

  test("should sign a tzip32 payload", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Sign and Verify Payloads" });
    await page.getByTestId("string-payload-input").fill("Hello, world!");
    await page.getByTestId("sign-tzip32-payload-button").click();
    await waitForSuccess({ page });

    const signatureText = await page
      .getByTestId("signature-output")
      .textContent();
    if (signatureText) {
      signature = signatureText;
    }
  });

  test("should verify a tzip32 payload", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Sign and Verify Payloads" });
    await page.getByTestId("contract-signature-input").fill(signature);
    await page.getByTestId("contract-payload-input").fill("Hello, world!");
    await page.getByTestId("verify-payload-tzip32-button").click();
    await waitForSuccess({ page });
  });

  test("should sign a michelson payload", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Sign and Verify Payloads" });
    await page.getByTestId("sign-michelson-data-button").click();
    await waitForSuccess({ page });
  });
});
