import { test } from "@playwright/test";
import { goToTest, waitForSuccess } from "./helpers.ts";
import { getSharedPage, setupSharedContext } from "./shared-context.ts";

test.describe("Contract Events", () => {
  test.beforeAll(async () => {
    await setupSharedContext();
  });

  test("should emit event", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Contract Events" });
    await page.getByTestId("emit-event-button").click();
    await waitForSuccess({ page });
  });

  test("should get event schema", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Contract Events" });
    await page.getByRole("button", { name: "Get Event Schema" }).click();
    await page.waitForSelector("text=%my_contract_event", {
      timeout: 5000,
      state: "visible",
    });
  });

  test("should subscribe and unsubscribe from events", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Contract Events" });

    await page.getByTestId("subscribe-to-all-events").click();
    await page.waitForSelector(
      "text=Successfully subscribed to contract events",
      {
        timeout: 5000,
        state: "visible",
      },
    );

    await page.getByTestId("unsubscribe-from-events").click();
    await page.waitForSelector(
      "text=Successfully unsubscribed from contract events",
      {
        timeout: 5000,
        state: "visible",
      },
    );
  });
});
