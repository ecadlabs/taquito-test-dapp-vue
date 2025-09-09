import { test } from "@playwright/test";
import { getSharedPage, setupSharedContext } from "./shared-context.ts";
import { goToTest, waitForSuccess } from "./helpers.ts";

test.describe("Complex Contract Parameters", () => {
  test.beforeAll(async () => {
    await setupSharedContext();
  });

  test("should add simple record", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Complex Contract Parameters" });

    await page.getByRole("button", { name: "Add Simple Record" }).click();
    await waitForSuccess({ page });
  });

  test("should set nested objects", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Complex Contract Parameters" });

    await page.getByRole("button", { name: "Set Nested Objects" }).click();
    await waitForSuccess({ page });
  });

  test("should add user to set", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Complex Contract Parameters" });

    await page.getByRole("button", { name: "Add User" }).click();
    await waitForSuccess({ page });
  });

  test("should remove user from set", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Complex Contract Parameters" });

    await page.getByRole("button", { name: "Remove User" }).click();
    await waitForSuccess({ page });
  });

  test("should update global metadata", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Complex Contract Parameters" });

    await page.getByRole("button", { name: "Update Metadata" }).click();
    await waitForSuccess({ page });
  });

  test("should get simple record via view", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Complex Contract Parameters" });

    await page.getByRole("button", { name: "Get Simple Record" }).click();
    await waitForSuccess({ page });
  });

  test("should get nested objects via view", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Complex Contract Parameters" });

    await page.getByRole("button", { name: "Get Nested Objects" }).click();
    await waitForSuccess({ page });
  });

  test("should get all metadata", async () => {
    const page = getSharedPage();
    await goToTest({ page, testName: "Complex Contract Parameters" });

    await page.getByRole("button", { name: "Get All Metadata" }).click();
    await waitForSuccess({ page });
  });
});
