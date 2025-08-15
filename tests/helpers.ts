import { expect } from "@playwright/test";

export const connectToWallet = async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Taquito Playground" }),
  ).toBeVisible();

  // Connect wallet
  await page.getByRole("button", { name: "Connect Wallet" }).click();
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "Programmatic (Testing)" }).click();
  await page.getByRole("button", { name: "Connect" }).click();
  await page.waitForSelector("text=Wallet connected");
};

export const goToTest = async ({ page, testName }) => {
  await page.getByRole("link", { name: "Examples" }).first().click();
  await page.getByRole("link", { name: testName }).first().click();
  await page.waitForSelector(`h1:has-text("${testName}")`);
};

export const waitForSuccess = async ({ page }) => {
  await page.waitForSelector('div[data-testid="diagramComplete"]');
};
