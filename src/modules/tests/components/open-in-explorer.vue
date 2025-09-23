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
import { ExternalLink, Copy } from "lucide-vue-next";
import { computed } from "vue";
import { useSettingsStore } from "@/stores/settingsStore";

const props = defineProps<{
  address: string;
}>();

const settingsStore = useSettingsStore();
const networkType = import.meta.env.VITE_NETWORK_TYPE;

const indexerName = computed(() => settingsStore.settings.indexer.name);

const indexerUrl = computed(() =>
  buildIndexerUrl(settingsStore.settings.indexer, networkType),
);

const openInExplorer = () => {
  window.open(`${indexerUrl.value}/${props.address}/storage`, "_blank");
};
</script>
