import assert from "node:assert/strict";
import test from "node:test";
import { resolveBeaconWalletDisplay, toSafeIconUrl } from "@/lib/walletDisplay";
import { FakeBeaconWallet } from "@/modules/tests/fakes/fakeBeaconWallet";

const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

test("toSafeIconUrl accepts https URLs and image data URIs", () => {
  for (const icon of [
    "https://wallet.kukai.app/assets/img/header-logo.svg",
    PNG,
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==",
    "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
    "data:image/webp;base64,UklGRhoAAABXRUJQ",
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=",
  ]) {
    assert.equal(toSafeIconUrl(icon), icon, icon.slice(0, 40));
  }
});

test("toSafeIconUrl rejects other schemes, relative paths, and non-image data URIs", () => {
  for (const icon of [
    undefined,
    "",
    "   ",
    "http://insecure.example.com/logo.png",
    "javascript:alert(1)",
    "JAVASCRIPT:alert(1)",
    "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
    "data:image/svg+xml,<svg onload=alert(1)>",
    "kukai.png",
    "/assets/kukai.png",
    "//cdn.example.com/logo.png",
    "ftp://example.com/logo.png",
  ]) {
    assert.equal(toSafeIconUrl(icon), undefined, String(icon));
  }
});

test("resolveBeaconWalletDisplay returns name and safe icon from getWalletInfo", async () => {
  const wallet = new FakeBeaconWallet();
  wallet.walletInfo = { name: "Kukai Wallet", icon: PNG, type: "web" };

  assert.deepEqual(await resolveBeaconWalletDisplay(wallet), {
    name: "Kukai Wallet",
    iconUrl: PNG,
  });
});

test("resolveBeaconWalletDisplay drops an unsafe icon and keeps the name", async () => {
  const wallet = new FakeBeaconWallet();
  wallet.walletInfo = { name: "Sketchy", icon: "javascript:alert(1)" };

  assert.deepEqual(await resolveBeaconWalletDisplay(wallet), {
    name: "Sketchy",
  });
});

test("resolveBeaconWalletDisplay returns nothing when disconnected or unnamed", async () => {
  const wallet = new FakeBeaconWallet();

  wallet.walletInfo = undefined;
  assert.deepEqual(await resolveBeaconWalletDisplay(wallet), {});

  wallet.walletInfo = { name: "  " };
  assert.deepEqual(await resolveBeaconWalletDisplay(wallet), {});
});
