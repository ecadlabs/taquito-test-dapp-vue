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
};

const defaultSettings: Settings = {
  indexer: availableIndexers[0],
};

export const useSettingsStore = defineStore("settings", () => {
  const settings = ref<Settings>(
    JSON.parse(
      localStorage.getItem("playground-settings") ??
        JSON.stringify(defaultSettings),
    ) as Settings,
  );
  const isRevealed = ref(true);

  const getSettings = computed(() => settings.value);
  const getIndexer = computed(() => settings.value.indexer);
  const getIsRevealed = computed(() => isRevealed.value);

  // Update the settings in localStorage when the settings change so they persist across sessions
  watch(
    settings,
    (newValue) => {
      localStorage.setItem("playground-settings", JSON.stringify(newValue));
    },
    { deep: true, immediate: true },
  );

  return {
    isRevealed,
    settings,
    getSettings,
    getIndexer,
    getIsRevealed,
  };
});
