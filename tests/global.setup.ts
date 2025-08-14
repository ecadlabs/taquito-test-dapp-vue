import { test as setup, expect } from "@playwright/test";

setup("connect to wallet", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Taquito Playground" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Connect Wallet" }).click();
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "Programmatic (Testing)" }).click();
  await page.getByRole("button", { name: "Connect" }).click();
  await page.waitForSelector("text=Wallet connected");
});
