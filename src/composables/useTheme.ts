import { applyBeaconAppearance } from "@/lib/beaconAppearance";
import { useSettingsStore, type ThemeMode } from "@/stores/settingsStore";
import { useWalletStore } from "@/stores/walletStore";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { usePreferredDark } from "@vueuse/core";
import { watch } from "vue";

export const useTheme = () => {
  const settingsStore = useSettingsStore();
  const walletStore = useWalletStore();
  const prefersDark = usePreferredDark();

  const applyTheme = (themeMode: ThemeMode) => {
    const isSystemDark = prefersDark.value;

    if (typeof window !== "undefined") {
      const root = window.document.documentElement;
      const isDark =
        themeMode === "dark" || (themeMode === "system" && isSystemDark);
      root.classList.toggle("dark", isDark);
    }

    const activeWallet =
      walletStore.getWallet instanceof BeaconWallet
        ? walletStore.getWallet
        : undefined;

    applyBeaconAppearance(
      {
        themeMode,
        beaconLocale: settingsStore.getBeaconLocale,
        beaconDirection: settingsStore.getBeaconDirection,
        beaconCustomTitle: settingsStore.getBeaconCustomTitle,
      },
      isSystemDark,
      activeWallet,
    ).catch((error) => {
      console.error("Failed to sync Beacon appearance:", error);
    });
  };

  const getSystemTheme = (): "dark" | "light" => {
    return prefersDark.value ? "dark" : "light";
  };

  const getCurrentTheme = (): ThemeMode => {
    return settingsStore.getThemeMode;
  };

  // Sync Playground theme and Beacon UI appearance (ColorMode + i18n) whenever
  // settings, OS preference, or the connected Beacon wallet change.
  watch(
    () =>
      [
        settingsStore.getThemeMode,
        settingsStore.getBeaconLocale,
        settingsStore.getBeaconDirection,
        settingsStore.getBeaconCustomTitle,
        prefersDark.value,
        walletStore.getWallet,
      ] as const,
    ([newTheme]) => {
      applyTheme(newTheme);
    },
    { immediate: true },
  );

  return {
    getSystemTheme,
    getCurrentTheme,
    applyTheme,
  };
};
