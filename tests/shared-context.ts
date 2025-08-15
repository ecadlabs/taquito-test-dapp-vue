import { chromium, Browser, BrowserContext, Page } from "@playwright/test";

let sharedBrowser: Browser;
let sharedContext: BrowserContext;
let sharedPage: Page;

export async function setupSharedContext() {
  if (!sharedBrowser) {
    sharedBrowser = await chromium.launch();
    sharedContext = await sharedBrowser.newContext();
    sharedPage = await sharedContext.newPage();

    // Connect wallet
    await sharedPage.goto("/");
    await sharedPage.getByRole("button", { name: "Connect Wallet" }).click();
    await sharedPage.getByRole("combobox").click();
    await sharedPage
      .getByRole("option", { name: "Programmatic (Testing)" })
      .click();
    await sharedPage.getByRole("button", { name: "Connect" }).click();
    await sharedPage.waitForSelector("text=Wallet connected");
  }

  return { sharedBrowser, sharedContext, sharedPage };
}

export async function cleanupSharedContext() {
  if (sharedPage) await sharedPage.close();
  if (sharedContext) await sharedContext.close();
  if (sharedBrowser) await sharedBrowser.close();
}

export function getSharedPage() {
  return sharedPage;
}
