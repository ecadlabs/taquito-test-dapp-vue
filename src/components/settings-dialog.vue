<template>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Settings</DialogTitle>
    </DialogHeader>

    <div class="space-y-2">
      <div class="flex justify-between items-center">
        <p>Indexer</p>
        <Select v-model="settingsStore.settings.indexer">
          <SelectTrigger class="w-[180px]">
            <SelectValue placeholder="Select an indexer" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem v-for="indexer in indexers" :value="indexer">
                {{ indexer.name }}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div class="flex flex-col gap-1 justify-end">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-2">
            <p>RPC URL</p>
            <Badge
              variant="outline"
              v-if="
                rpcHealthCheckDuration > 0 &&
                !runningHealthCheck &&
                isRpcHealthy
              "
            >
              <p>{{ rpcHealthCheckDuration }}ms</p>
            </Badge>
          </div>

          <div class="flex items-center">
            <LoaderCircle
              v-if="runningHealthCheck"
              class="size-4 text-muted-foreground animate-spin mr-2"
            />
            <Input
              v-model="settingsStore.settings.rpcUrl"
              type="text"
              placeholder="RPC URL"
              id="rpc-url"
            />
            <Button
              v-if="settingsStore.isUsingCustomRpcUrl"
              variant="ghost"
              size="icon"
              @click="settingsStore.resetRpcUrl"
              class="ml-1"
            >
              <Undo2 class="size-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
        <div
          v-if="settingsStore.isUsingCustomRpcUrl"
          class="ml-auto flex items-center gap-1"
        >
          <TriangleAlert class="size-3 text-orange-500" />
          <p class="text-xs text-muted-foreground">Using custom RPC URL</p>
        </div>
        <div
          v-if="!isRpcHealthy"
          class="ml-auto flex items-center gap-1 text-red-500"
        >
          <TriangleAlert class="size-3" />
          <p class="text-xs">Cannot reach RPC URL</p>
        </div>
      </div>
    </div>

    <DialogFooter class="flex items-center">
      <div class="text-xs text-muted-foreground">
        <p>Version {{ version }}</p>
        <Separator orientation="vertical" class="h-4" />
        <p>Network: {{ network }}</p>
        <p>Git SHA: {{ gitSha }}</p>
      </div>
      <Button variant="secondary" @click="emit('close')" class="ml-auto">
        <p>Close</p>
      </Button>
    </DialogFooter>
  </DialogContent>
</template>

<script setup lang="ts">
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  availableIndexers,
  useSettingsStore,
  type IndexerOption,
} from "@/stores/settingsStore";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { LoaderCircle, TriangleAlert, Undo2 } from "lucide-vue-next";
import { useDebounce } from "@vueuse/core";
import { watch, computed, ref } from "vue";
import { Badge } from "@/components/ui/badge";

const emit = defineEmits(["close"]);

const settingsStore = useSettingsStore();

const indexers: IndexerOption[] = availableIndexers;

const gitSha = import.meta.env.VITE_GITHUB_SHA;
const version = import.meta.env.VITE_VERSION;
const network = import.meta.env.VITE_NETWORK_TYPE;

const isRpcHealthy = ref(true);
const rpcHealthCheckDuration = ref(0);

const rpcUrlRef = computed(() => settingsStore.settings.rpcUrl);
const debouncedRpcUrl = useDebounce(rpcUrlRef, 500);
const runningHealthCheck = ref(false);

watch(debouncedRpcUrl, (newRpcUrl: string) => {
  const checkRpcHealth = async (url: string) => {
    runningHealthCheck.value = true;

    try {
      const response = await fetch(`${url}/chains/main/blocks/head/header`, {
        method: "GET",
      });
      return response.ok;
    } catch {
      return false;
    } finally {
      runningHealthCheck.value = false;
    }
  };

  (async () => {
    const startTime = new Date();
    isRpcHealthy.value = await checkRpcHealth(newRpcUrl);
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    rpcHealthCheckDuration.value = duration;
  })();
});
</script>
