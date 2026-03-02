<template>
  <div class="flex items-center">
    <Button
      @click="openInExplorer()"
      variant="link"
      class="text-muted-foreground"
    >
      <p class="text-xs">Open in {{ indexerName }}</p>
      <ExternalLink class="size-3" />
    </Button>
    <Button
      @click="copyToClipboard(address)"
      variant="link"
      class="text-muted-foreground -ml-2"
    >
      <Copy class="size-3" />
      <p class="sr-only">Copy Address to Clipboard</p>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { buildIndexerUrl, copyToClipboard } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settingsStore";
import { Copy, ExternalLink } from "lucide-vue-next";
import { computed } from "vue";

const props = defineProps<{
  address: string;
}>();

const settingsStore = useSettingsStore();
const networkType = import.meta.env.VITE_NETWORK_TYPE;
const networkName = import.meta.env.VITE_NETWORK_NAME;

const indexerName = computed(() => settingsStore.settings.indexer.name);

const indexerUrl = computed(() =>
  buildIndexerUrl(
    settingsStore.settings.indexer,
    networkType,
    props.address,
    "contract",
    networkName,
  ),
);

const openInExplorer = () => {
  window.open(indexerUrl.value, "_blank");
};
</script>
