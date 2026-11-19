import { getBeaconLocaleOptions, type ThemeMode } from "@/lib/beaconAppearance";
import {
  formatRpcHealthSummary,
  probeRpcHealth,
  type RpcHealthStatus,
} from "@/lib/rpcHealth";
import {
  NetworkType,
  type BeaconTextDirection,
} from "@taquito/beacon-wallet/types";
import { useDebounce } from "@vueuse/core";
import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";

export type { ThemeMode };

export type IndexerOption = {
  name: string;
  value: string;
  url: string;
  availableNetworks: NetworkType[];
};

export const availableIndexers: IndexerOption[] = [
  {
    name: "TzKT",
    value: "tzkt",
    url: "https://[networkType].tzkt.io",
    availableNetworks: [
      NetworkType.GHOSTNET,
      NetworkType.SHADOWNET,
      NetworkType.SEOULNET,
      NetworkType.TEZLINK_SHADOWNET,
    ],
  },
  {
    name: "Tzstats",
    value: "tzstats",
    url: "https://[networkType]tzstats.com",
    availableNetworks: [NetworkType.GHOSTNET],
  },
];

export type Settings = {
  indexer: IndexerOption;
  rpcUrl: string;
  confirmationCount: number;
  themeMode: ThemeMode;
  beaconLocale: string;
  beaconDirection: BeaconTextDirection;
  beaconCustomTitle: string;
};

const activeRpcUrlByNetwork: Record<string, string> = {
  shadownet: "https://rpc.shadownet.teztnets.com",
  ushuaianet: "https://rpc.ushuaianet.teztnets.com",
  "tezlink-shadownet": "https://rpc.shadownet.tezlink.nomadic-labs.com",
};
const retiredRpcDomain = ["ecadinfra", "com"].join(".");

const isRetiredRpcUrl = (rpcUrl: string | undefined): boolean =>
  rpcUrl?.includes(retiredRpcDomain) ?? false;

const getDefaultRpcUrl = (): string => {
  const configuredRpcUrl = import.meta.env.VITE_RPC_URL;
  if (!isRetiredRpcUrl(configuredRpcUrl)) {
    return configuredRpcUrl;
  }

  return (
    activeRpcUrlByNetwork[import.meta.env.VITE_NETWORK_TYPE] ?? configuredRpcUrl
  );
};

const defaultSettings: Settings = {
  indexer:
    availableIndexers.find((indexer) =>
      indexer.availableNetworks.includes(
        import.meta.env.VITE_NETWORK_TYPE as NetworkType,
      ),
    ) || availableIndexers[0],
  rpcUrl: getDefaultRpcUrl(),
  confirmationCount: 3,
  themeMode: "light",
  beaconLocale: "auto",
  beaconDirection: "auto",
  beaconCustomTitle: "",
};

export const useSettingsStore = defineStore("settings", () => {
  const VALID_DIRECTIONS: ReadonlySet<BeaconTextDirection> = new Set([
    "auto",
    "ltr",
    "rtl",
  ]);
  const VALID_THEMES: ReadonlySet<ThemeMode> = new Set([
    "light",
    "dark",
    "system",
  ]);
  const VALID_LOCALES: ReadonlySet<string> = new Set([
    "auto",
    ...getBeaconLocaleOptions().map((item) => item.locale),
  ]);

  const migrateSettings = (settings: Settings): Settings => ({
    ...settings,
    rpcUrl: isRetiredRpcUrl(settings.rpcUrl)
      ? defaultSettings.rpcUrl
      : settings.rpcUrl,
    themeMode: VALID_THEMES.has(settings.themeMode)
      ? settings.themeMode
      : defaultSettings.themeMode,
    beaconLocale:
      typeof settings.beaconLocale === "string" &&
      VALID_LOCALES.has(settings.beaconLocale)
        ? settings.beaconLocale
        : defaultSettings.beaconLocale,
    beaconDirection: VALID_DIRECTIONS.has(settings.beaconDirection)
      ? settings.beaconDirection
      : defaultSettings.beaconDirection,
    beaconCustomTitle:
      typeof settings.beaconCustomTitle === "string"
        ? settings.beaconCustomTitle
        : defaultSettings.beaconCustomTitle,
  });

  const getMergedSettings = (): Settings => {
    const stored = localStorage.getItem("playground-settings");
    if (!stored) return { ...defaultSettings };
    try {
      const parsed = JSON.parse(stored) as Partial<Settings>;
      return migrateSettings({
        ...defaultSettings,
        ...parsed,
      });
    } catch {
      return { ...defaultSettings };
    }
  };

  const settings = ref<Settings>(getMergedSettings());

  const getSettings = computed(() => settings.value);
  const getIndexer = computed(() => settings.value.indexer);
  const getConfirmationCount = computed(() => settings.value.confirmationCount);
  const getThemeMode = computed(() => settings.value.themeMode);
  const getBeaconLocale = computed(() => settings.value.beaconLocale);
  const getBeaconDirection = computed(() => settings.value.beaconDirection);
  const getBeaconCustomTitle = computed(() => settings.value.beaconCustomTitle);
  const isUsingCustomRpcUrl = computed(() => {
    return settings.value.rpcUrl !== defaultSettings.rpcUrl;
  });

  const setThemeMode = (themeMode: ThemeMode) => {
    settings.value.themeMode = themeMode;
  };

  const setBeaconLocale = (locale: string) => {
    settings.value.beaconLocale = locale;
  };

  const setBeaconDirection = (direction: BeaconTextDirection) => {
    settings.value.beaconDirection = direction;
  };

  const setBeaconCustomTitle = (title: string) => {
    settings.value.beaconCustomTitle = title;
  };

  // Update the settings in localStorage when the settings change so they persist across sessions
  watch(
    settings,
    (newValue) => {
      localStorage.setItem("playground-settings", JSON.stringify(newValue));
    },
    { deep: true, immediate: true },
  );

  const resetRpcUrl = () => {
    settings.value.rpcUrl = defaultSettings.rpcUrl;
  };

  const rpcHealthStatus = ref<RpcHealthStatus>("checking");
  const rpcHealthCheckDuration = ref<number>(0);
  const rpcBlockLevel = ref<number | null>(null);
  const rpcChainId = ref<string | null>(null);
  const rpcHealthError = ref<string | null>(null);

  const isRpcHealthy = computed(() => rpcHealthStatus.value !== "unhealthy");
  const runningHealthCheck = computed(
    () => rpcHealthStatus.value === "checking",
  );
  const rpcHealthSummary = computed(() =>
    formatRpcHealthSummary({
      status: rpcHealthStatus.value,
      durationMs: rpcHealthCheckDuration.value,
      blockLevel: rpcBlockLevel.value,
      error: rpcHealthError.value,
    }),
  );

  let latestProbeSequence = 0;

  const checkRpcHealth = async (url = settings.value.rpcUrl): Promise<void> => {
    const probeSequence = ++latestProbeSequence;
    rpcHealthStatus.value = "checking";

    const result = await probeRpcHealth(url);
    if (probeSequence !== latestProbeSequence) {
      return;
    }

    rpcHealthStatus.value = result.healthy ? "healthy" : "unhealthy";
    rpcHealthCheckDuration.value = result.durationMs;
    rpcBlockLevel.value = result.blockLevel;
    rpcChainId.value = result.chainId;
    rpcHealthError.value = result.error;
  };

  const rpcUrlRef = computed(() => settings.value.rpcUrl);
  const debouncedRpcUrl = useDebounce(rpcUrlRef, 400);

  watch(
    debouncedRpcUrl,
    (newRpcUrl: string) => {
      void checkRpcHealth(newRpcUrl);
    },
    { immediate: true },
  );

  return {
    settings,
    getSettings,
    getIndexer,
    getConfirmationCount,
    getThemeMode,
    getBeaconLocale,
    getBeaconDirection,
    getBeaconCustomTitle,
    isUsingCustomRpcUrl,
    rpcHealthStatus,
    rpcHealthCheckDuration,
    rpcBlockLevel,
    rpcChainId,
    rpcHealthError,
    isRpcHealthy,
    runningHealthCheck,
    rpcHealthSummary,
    checkRpcHealth,
    setThemeMode,
    setBeaconLocale,
    setBeaconDirection,
    setBeaconCustomTitle,
    resetRpcUrl,
  };
});
