import assert from "node:assert/strict";
import test from "node:test";
import {
  ColorMode,
  NotGrantedBeaconError,
  PeerUnreachableBeaconError,
  TransactionInvalidBeaconError,
  AbortedBeaconError,
  getBeaconDirection,
  getBeaconErrorCopy,
  getBeaconLocale,
  getBeaconMessages,
  resetBeaconI18n,
  resolveBeaconLang,
  setBeaconLocale,
  type BeaconI18nConfig,
} from "@taquito/beacon-wallet/types";
import { getColorMode, setColorMode } from "@taquito/beacon-wallet";
import { validateTezosAddress } from "@/lib/utils";
import { formatBeaconError } from "@/lib/walletEvents";
import {
  applyBeaconAppearance,
  buildBeaconClientAppearanceOptions,
  buildBeaconI18nConfig,
  getBeaconLocaleOptions,
  resolveColorMode,
  type BeaconAppearanceSettings,
} from "@/lib/beaconAppearance";

test("resolveColorMode maps light, dark, and system theme modes to Beacon ColorMode", () => {
  assert.equal(resolveColorMode("light", true), ColorMode.LIGHT);
  assert.equal(resolveColorMode("light", false), ColorMode.LIGHT);
  assert.equal(resolveColorMode("dark", false), ColorMode.DARK);
  assert.equal(resolveColorMode("dark", true), ColorMode.DARK);
  assert.equal(resolveColorMode("system", true), ColorMode.DARK);
  assert.equal(resolveColorMode("system", false), ColorMode.LIGHT);
});

test("getBeaconLocaleOptions lists all 6 built-in Beacon locales with metadata and RTL flag", () => {
  const locales = getBeaconLocaleOptions();
  const tags = locales.map((item) => item.locale);

  for (const expected of ["en", "fr", "es", "de", "ja", "ar"]) {
    assert.ok(
      tags.includes(expected),
      `Expected built-in locale "${expected}"`,
    );
  }

  const ar = locales.find((item) => item.locale === "ar");
  assert.equal(ar?.direction, "rtl");
  assert.equal(ar?.name, "العربية");

  const en = locales.find((item) => item.locale === "en");
  assert.equal(en?.direction, "ltr");
  assert.equal(en?.name, "English");
});

test("buildBeaconI18nConfig maps auto locale, direction, and custom pairing title overrides", () => {
  const autoConfig = buildBeaconI18nConfig({
    themeMode: "light",
    beaconLocale: "auto",
    beaconDirection: "auto",
    beaconCustomTitle: "   ",
  });
  assert.equal(autoConfig.locale, undefined);
  assert.equal(autoConfig.direction, "auto");
  assert.equal(autoConfig.translations, undefined);

  const customConfig = buildBeaconI18nConfig({
    themeMode: "dark",
    beaconLocale: "ar",
    beaconDirection: "rtl",
    beaconCustomTitle: "  Connect to Taquito Playground  ",
  });
  assert.equal(customConfig.locale, "ar");
  assert.equal(customConfig.direction, "rtl");
  assert.deepEqual(customConfig.translations, {
    dapp: {
      choosePreferredWallet: "Connect to Taquito Playground",
    },
  });
});

test("buildBeaconClientAppearanceOptions returns DAppClientOptions appearance fields", () => {
  const options = buildBeaconClientAppearanceOptions(
    {
      themeMode: "system",
      beaconLocale: "ja",
      beaconDirection: "ltr",
      beaconCustomTitle: "Custom Wallet Picker",
    },
    true,
  );

  assert.equal(options.colorMode, ColorMode.DARK);
  assert.equal(options.locale, "ja");
  assert.equal(options.direction, "ltr");
  assert.deepEqual(options.translations, {
    dapp: { choosePreferredWallet: "Custom Wallet Picker" },
  });

  const autoOptions = buildBeaconClientAppearanceOptions(
    {
      themeMode: "light",
      beaconLocale: "auto",
      beaconDirection: "auto",
      beaconCustomTitle: "",
    },
    false,
  );
  assert.equal(autoOptions.colorMode, ColorMode.LIGHT);
  assert.equal("locale" in autoOptions, false);
  assert.equal(autoOptions.direction, "auto");
  assert.equal("translations" in autoOptions, false);
});

test("applyBeaconAppearance updates Beacon global i18n, ColorMode, and active BeaconWallet", async () => {
  const appliedConfigs: BeaconI18nConfig[] = [];
  const appliedModes: ColorMode[] = [];

  const fakeWallet = {
    configureI18n(config: BeaconI18nConfig) {
      appliedConfigs.push(config);
    },
    async setColorMode(mode: ColorMode) {
      appliedModes.push(mode);
    },
  };

  try {
    const settings: BeaconAppearanceSettings = {
      themeMode: "dark",
      beaconLocale: "ar",
      beaconDirection: "auto",
      beaconCustomTitle: "My Custom Heading",
    };

    await applyBeaconAppearance(settings, false, fakeWallet);

    assert.equal(getBeaconLocale(), "ar");
    assert.equal(resolveBeaconLang(), "ar");
    assert.equal(getBeaconDirection(), "rtl");
    assert.equal(
      getBeaconMessages().dapp.choosePreferredWallet,
      "My Custom Heading",
    );
    assert.equal(await getColorMode(), ColorMode.DARK);

    assert.equal(appliedConfigs.length, 1);
    assert.equal(appliedConfigs[0].locale, "ar");
    assert.deepEqual(appliedModes, [ColorMode.DARK]);
  } finally {
    resetBeaconI18n();
    await setColorMode(ColorMode.LIGHT);
  }
});

test("formatBeaconError handles concrete BeaconError subclasses and respects active Beacon i18n locale", () => {
  try {
    resetBeaconI18n();
    setBeaconLocale("en");

    const aborted = new AbortedBeaconError();
    assert.match(formatBeaconError(aborted), /aborted|cancelled/i);

    const unreachable = new PeerUnreachableBeaconError();
    assert.match(formatBeaconError(unreachable), /respond|reachable|timeout/i);

    const txInvalid = new TransactionInvalidBeaconError(undefined, {
      errorData: [
        {
          kind: "permanent",
          id: "proto.024.michelson_v1.script_rejected",
          with: { string: "INSUFFICIENT_BALANCE" },
        },
      ],
    });
    const txInvalidFormatted = formatBeaconError(txInvalid);
    assert.match(txInvalidFormatted, /invalid/i);
    assert.match(txInvalidFormatted, /INSUFFICIENT_BALANCE/);

    // Switch Beacon i18n to French and verify formatBeaconError uses localized copy
    setBeaconLocale("fr");
    const frExpected = getBeaconErrorCopy(
      new NotGrantedBeaconError().errorType,
    ).description;
    assert.equal(formatBeaconError(new NotGrantedBeaconError()), frExpected);
  } finally {
    resetBeaconI18n();
  }
});

test("validateTezosAddress validates real base58check addresses and rejects invalid checksums", () => {
  // Valid tz1 and KT1 addresses
  assert.equal(
    validateTezosAddress("tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb"),
    true,
  );
  assert.equal(
    validateTezosAddress("KT1PWx2mnDueood7fEmfbBDKx1D9BAnnXitn"),
    true,
  );

  // Same length and prefix as a tz1 address, but corrupted base58check checksum
  assert.equal(
    validateTezosAddress("tz1VSUr8wwNhLAzempoch5d6hLRiTh8CjcjX"),
    false,
  );
  // Bare address validator must reject %entrypoint suffixes and whitespace
  assert.equal(
    validateTezosAddress("KT1PWx2mnDueood7fEmfbBDKx1D9BAnnXitn%bad suffix!"),
    false,
  );
  assert.equal(validateTezosAddress("not-an-address"), false);
});
