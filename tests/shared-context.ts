import { Browser, BrowserContext, chromium, Page } from "@playwright/test";
import { connectToWallet } from "./helpers";

let sharedBrowser: Browser;
let sharedContext: BrowserContext;
let sharedPage: Page;
let isSetup = false;

export async function setupSharedContext() {
  if (!isSetup) {
    sharedBrowser = await chromium.launch();
    sharedContext = await sharedBrowser.newContext();
    sharedPage = await sharedContext.newPage();

    // Connect wallet
    await connectToWallet({ page: sharedPage });
    isSetup = true;
  }

  return { sharedBrowser, sharedContext, sharedPage };
}

export async function cleanupSharedContext() {
  if (sharedPage) await sharedPage.close();
  if (sharedContext) await sharedContext.close();
  if (sharedBrowser) await sharedBrowser.close();
  isSetup = false;
}

export function getSharedPage() {
  if (!isSetup) {
    throw new Error(
      "Shared context not set up. Call setupSharedContext() first.",
    );
  }
  return sharedPage;
}
