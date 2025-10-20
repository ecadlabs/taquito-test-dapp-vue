import { useSettingsStore, type ThemeMode } from "@/stores/settingsStore";
import { watch } from "vue";

export const useTheme = () => {
  const settingsStore = useSettingsStore();

  const applyTheme = (themeMode: ThemeMode) => {
    const root = window.document.documentElement;

    if (themeMode === "dark") {
      root.classList.add("dark");
    } else if (themeMode === "light") {
      root.classList.remove("dark");
    } else {
      // System preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      if (prefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  };

  const getSystemTheme = (): "dark" | "light" => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  const getCurrentTheme = (): ThemeMode => {
    return settingsStore.getThemeMode;
  };

  // Apply theme when it changes
  watch(
    () => settingsStore.getThemeMode,
    (newTheme) => {
      applyTheme(newTheme);
    },
    { immediate: true },
  );

  // Listen for system theme changes when in system mode
  if (typeof window !== "undefined") {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = () => {
      const currentThemeMode = settingsStore.getThemeMode;
      if (currentThemeMode === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    // Apply initial theme
    const initialThemeMode = settingsStore.getThemeMode;
    applyTheme(initialThemeMode);
  }

  return {
    getSystemTheme,
    getCurrentTheme,
    applyTheme,
  };
};
