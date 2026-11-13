import { expect, type Page, test } from "@playwright/test";

const resetBeaconState = async (page: Page) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    indexedDB.deleteDatabase("WALLET_CONNECT_V2_INDEXED_DB");
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Taquito Playground" }),
  ).toBeVisible();
};

// The Beacon pairing modal has no Escape handler; it closes on a backdrop click.
const dismissBeaconPairing = async (page: Page) => {
  await expect(page.getByText("Kukai").first()).toBeVisible();
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("Playwright page has no viewport");
  await page.mouse.click(8, viewport.height - 8);
  await expect(page.getByText("Kukai").first()).toBeHidden();
};

const inspector = (page: Page) =>
  page.getByRole("complementary", { name: "Beacon inspector" });

test.describe("Beacon inspector drawer", () => {
  test("opens from the header and shows an empty state", async ({ page }) => {
    await resetBeaconState(page);

    await page.getByRole("button", { name: "Open Beacon inspector" }).click();

    await expect(inspector(page)).toBeVisible();
    await expect(
      inspector(page).getByText("No Beacon activity yet"),
    ).toBeVisible();

    await inspector(page)
      .getByRole("button", { name: "Close Beacon inspector" })
      .click();
    await expect(inspector(page)).toBeHidden();
  });

  test("records Beacon pairing activity without a wallet", async ({ page }) => {
    await resetBeaconState(page);

    await page.getByRole("button", { name: "Connect Wallet" }).click();
    await page.getByRole("button", { name: "Connect" }).click();
    await dismissBeaconPairing(page);

    await page.getByRole("button", { name: "Open Beacon inspector" }).click();

    await expect(
      inspector(page).getByRole("listitem").filter({ hasText: "PAIR_INIT" }),
    ).toHaveCount(1);
  });

  test("exports the timeline as JSON Lines", async ({ page }) => {
    await resetBeaconState(page);

    await page.getByRole("button", { name: "Connect Wallet" }).click();
    await page.getByRole("button", { name: "Connect" }).click();
    await dismissBeaconPairing(page);

    await page.getByRole("button", { name: "Open Beacon inspector" }).click();
    const downloadPromise = page.waitForEvent("download");
    await inspector(page).getByRole("button", { name: "Export" }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(
      /^beacon-inspector-.*\.jsonl$/,
    );
  });

  test("records Beacon's own log lines when Beacon debug mode is on", async ({
    page,
  }) => {
    // beacon-core reads this flag once, when its module loads.
    await page.addInitScript(() => {
      Reflect.set(window, "beaconSdkDebugEnabled", true);
    });
    await resetBeaconState(page);

    await page.getByRole("button", { name: "Connect Wallet" }).click();
    await page.getByRole("button", { name: "Connect" }).click();
    await dismissBeaconPairing(page);

    await page.getByRole("button", { name: "Open Beacon inspector" }).click();
    const filters = inspector(page).getByRole("group", {
      name: "Filter timeline",
    });
    for (const lane of ["Events", "Messages", "Connection"]) {
      await filters.getByRole("button", { name: lane }).click();
    }
    await expect(
      filters.getByRole("button", { name: "SDK logs" }),
    ).toHaveAttribute("aria-pressed", "true");

    await expect(inspector(page).getByRole("listitem").first()).toBeVisible();
  });

  test("turns on Beacon debug logs from the drawer and remembers it", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await resetBeaconState(page);

    await page.getByRole("button", { name: "Open Beacon inspector" }).click();
    const toggle = inspector(page).getByRole("button", {
      name: "Beacon debug logs",
    });
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: "Connect Wallet" }).click();
    await page.getByRole("button", { name: "Connect" }).click();
    await dismissBeaconPairing(page);

    await inspector(page)
      .getByRole("button", { name: "Copy visible entries" })
      .click();
    const text = await page.evaluate(() => navigator.clipboard.readText());
    const kinds = text
      .trimEnd()
      .split("\n")
      .map((line) => {
        const parsed: unknown = JSON.parse(line);
        return typeof parsed === "object" && parsed !== null && "kind" in parsed
          ? parsed.kind
          : undefined;
      });
    expect(kinds.some((kind) => kind === "debug" || kind === "log")).toBe(true);

    await page.reload();
    await expect(
      inspector(page).getByRole("button", { name: "Beacon debug logs" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("copies the visible timeline to the clipboard as JSON Lines", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await resetBeaconState(page);

    await page.getByRole("button", { name: "Connect Wallet" }).click();
    await page.getByRole("button", { name: "Connect" }).click();
    await dismissBeaconPairing(page);

    await page.getByRole("button", { name: "Open Beacon inspector" }).click();
    const rows = await inspector(page).getByRole("listitem").count();
    await inspector(page)
      .getByRole("button", { name: "Copy visible entries" })
      .click();
    await expect(
      inspector(page).getByRole("button", { name: "Copy visible entries" }),
    ).toHaveText("Copied");

    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text.endsWith("\n")).toBe(true);
    const kinds = text
      .trimEnd()
      .split("\n")
      .map((line) => {
        const parsed: unknown = JSON.parse(line);
        return typeof parsed === "object" && parsed !== null && "kind" in parsed
          ? parsed.kind
          : undefined;
      });
    expect(kinds).toHaveLength(rows);
    expect(kinds).toContain("PAIR_INIT");
  });
});
