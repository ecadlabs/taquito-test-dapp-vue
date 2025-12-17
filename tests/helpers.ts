import { expect, Page } from "@playwright/test";

export const connectToWallet = async ({ page }: { page: Page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Taquito Playground" }),
  ).toBeVisible();

  // Connect wallet
  await page.getByRole("button", { name: "Connect Wallet" }).click();
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "Raw Private Key Access" }).click();
  const privateKey = process.env.TEST_WALLET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("TEST_WALLET_PRIVATE_KEY is not set");
  }
  await page.getByPlaceholder("edsk...").fill(privateKey);
  await page.getByRole("button", { name: "Connect" }).click();
  await page.waitForSelector("text=Wallet connected");
};

export const goToTest = async ({
  page,
  testName,
}: {
  page: Page;
  testName: string;
}) => {
  await page.getByRole("link", { name: "Examples" }).first().click();
  await page.getByRole("link", { name: testName }).first().click();
  await page.waitForSelector(`h1:has-text("${testName}")`);
};

export const waitForSuccess = async ({ page }: { page: Page }) => {
  // Wait for the diagram to complete
  await page.waitForSelector('div[data-testid="diagramComplete"]', {
    timeout: 60000, // Increased timeout for blockchain operations
    state: "visible",
  });
};

export const waitForError = async ({ page }: { page: Page }) => {
  // Wait for the diagram to enter an error state
  await page.waitForSelector('div[data-testid="diagramError"]', {
    timeout: 60000, // Increased timeout for blockchain operations
    state: "visible",
  });
};

export const waitForBalanceLoaded = async ({ page }: { page: Page }) => {
  await page.waitForFunction(
    () => {
      const balanceElement = document.querySelector('[class*="text-xl"]');
      if (!balanceElement) return false;
      const text = balanceElement.textContent;
      const isLoaded = text && text !== "..." && text.includes("ꜩ");
      return isLoaded;
    },
    { timeout: 15000 },
  );
};

export const delegate = async ({ page }: { page: Page }) => {
  await goToTest({ page, testName: "Delegation" });

  await page.waitForSelector('[role="combobox"]', { state: "visible" });
  await page.getByRole("combobox").click();
  await page.waitForSelector('[data-slot="command-item"]', {
    state: "visible",
  });
  await page.locator('[data-slot="command-item"]').first().click();

  await page.getByRole("button", { name: "Delegate" }).click();
  await waitForSuccess({ page });
};
