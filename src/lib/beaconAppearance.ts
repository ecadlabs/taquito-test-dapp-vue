import {
  setColorMode,
  type BeaconWallet,
  type DAppClientOptions,
} from "@taquito/beacon-wallet";
import {
  builtInLocales,
  ColorMode,
  configureBeaconI18n,
  type BeaconI18nConfig,
  type BeaconLocaleMetadata,
  type BeaconTextDirection,
  type BeaconTranslationOverrides,
} from "@taquito/beacon-wallet/types";

export type ThemeMode = "light" | "dark" | "system";

/** Persisted theme and Beacon UI appearance settings. */
export interface BeaconAppearanceSettings {
  themeMode: ThemeMode;
  /** `"auto"` delegates to Beacon's browser/document locale auto-detection. */
  beaconLocale: string;
  beaconDirection: BeaconTextDirection;
  /** Optional custom heading override for `dapp.choosePreferredWallet`. */
  beaconCustomTitle: string;
}

export type BeaconAppearanceTarget = Pick<
  BeaconWallet,
  "configureI18n" | "setColorMode"
>;

export type BeaconClientAppearanceOptions = Pick<
  DAppClientOptions,
  "colorMode" | "locale" | "direction" | "translations"
>;

/** Maps the Playground's theme mode to Beacon's `ColorMode` enum. */
export const resolveColorMode = (
  themeMode: ThemeMode,
  prefersDark: boolean,
): ColorMode => {
  if (themeMode === "dark") return ColorMode.DARK;
  if (themeMode === "light") return ColorMode.LIGHT;
  return prefersDark ? ColorMode.DARK : ColorMode.LIGHT;
};

/** Returns metadata for every built-in locale shipped with Beacon SDK. */
export const getBeaconLocaleOptions = (): readonly BeaconLocaleMetadata[] =>
  Object.values(builtInLocales).map((catalog) => catalog.meta);

/** Builds a `BeaconI18nConfig` from the Playground's persisted settings. */
export const buildBeaconI18nConfig = (
  settings: BeaconAppearanceSettings,
): BeaconI18nConfig => {
  const rawLocale =
    typeof settings.beaconLocale === "string"
      ? settings.beaconLocale.trim()
      : "";
  const locale = rawLocale && rawLocale !== "auto" ? rawLocale : undefined;
  const trimmedTitle =
    typeof settings.beaconCustomTitle === "string"
      ? settings.beaconCustomTitle.trim()
      : "";
  const translations: BeaconTranslationOverrides | undefined = trimmedTitle
    ? { dapp: { choosePreferredWallet: trimmedTitle } }
    : undefined;

  return {
    locale,
    direction: settings.beaconDirection,
    translations,
  };
};

/** Builds the appearance subset of `DAppClientOptions` for `new BeaconWallet`. */
export const buildBeaconClientAppearanceOptions = (
  settings: BeaconAppearanceSettings,
  prefersDark: boolean,
): BeaconClientAppearanceOptions => {
  const i18n = buildBeaconI18nConfig(settings);
  return {
    colorMode: resolveColorMode(settings.themeMode, prefersDark),
    direction: i18n.direction,
    ...(i18n.locale !== undefined ? { locale: i18n.locale } : {}),
    ...(i18n.translations !== undefined
      ? { translations: i18n.translations }
      : {}),
  };
};

/**
 * Syncs Beacon's global color mode and i18n state, and mirrors changes onto an
 * active `BeaconWallet` instance when one is connected.
 */
export const applyBeaconAppearance = async (
  settings: BeaconAppearanceSettings,
  prefersDark: boolean,
  activeWallet?: BeaconAppearanceTarget,
): Promise<void> => {
  const colorMode = resolveColorMode(settings.themeMode, prefersDark);
  const i18nConfig = buildBeaconI18nConfig(settings);

  configureBeaconI18n(i18nConfig);
  await setColorMode(colorMode);

  if (activeWallet) {
    activeWallet.configureI18n(i18nConfig);
    await activeWallet.setColorMode(colorMode);
  }
};
