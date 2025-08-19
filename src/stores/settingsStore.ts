import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";

export type IndexerOption = {
  name: string;
  value: string;
  url: string;
};

export const availableIndexers: IndexerOption[] = [
  {
    name: "TzKT",
    value: "tzkt",
    url: "https://[networkType].tzkt.io",
  },
  // {
  // 	name: 'Tzstats',
  // 	value: 'tzstats',
  // 	url: 'https://[networkType].tzstats.com',
  // },
];

export type Settings = {
  indexer: IndexerOption;
  rpcUrl: string;
};

const defaultSettings: Settings = {
  indexer: availableIndexers[0],
  rpcUrl: import.meta.env.VITE_RPC_URL,
};

export const useSettingsStore = defineStore("settings", () => {
  const getMergedSettings = (): Settings => {
    const stored = localStorage.getItem("playground-settings");
    if (!stored) return { ...defaultSettings };
    try {
      const parsed = JSON.parse(stored) as Partial<Settings>;
      return {
        ...defaultSettings,
        ...parsed,
      };
    } catch {
      return { ...defaultSettings };
    }
  };

  const settings = ref<Settings>(getMergedSettings());
  const isRevealed = ref(true);

  const getSettings = computed(() => settings.value);
  const getIndexer = computed(() => settings.value.indexer);
  const getIsRevealed = computed(() => isRevealed.value);
  const isUsingCustomRpcUrl = computed(() => {
    return settings.value.rpcUrl !== import.meta.env.VITE_RPC_URL;
  });

  // Update the settings in localStorage when the settings change so they persist across sessions
  watch(
    settings,
    (newValue) => {
      localStorage.setItem("playground-settings", JSON.stringify(newValue));
    },
    { deep: true, immediate: true },
  );

  const resetRpcUrl = () => {
    settings.value.rpcUrl = import.meta.env.VITE_RPC_URL;
  };

  return {
    isRevealed,
    settings,
    getSettings,
    getIndexer,
    getIsRevealed,
    isUsingCustomRpcUrl,
    resetRpcUrl,
  };
});
