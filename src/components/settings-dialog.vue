<template>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Settings</DialogTitle>
    </DialogHeader>

    <div class="space-y-4">
      <div class="flex flex-col gap-2">
        <Label :for="indexerSelectId" class="font-medium">Indexer</Label>
        <div class="w-full space-y-2 sm:w-auto">
          <Select v-model="settingsStore.settings.indexer">
            <SelectTrigger
              class="w-full sm:w-[220px]"
              :id="indexerSelectId"
              :aria-describedby="indexerHelpId"
            >
              <SelectValue placeholder="Select an indexer" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem
                  v-for="indexer in indexers"
                  :value="indexer"
                  :key="indexer.name"
                >
                  {{ indexer.name }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <p :id="indexerHelpId" class="text-muted-foreground text-xs">
            Determines which explorer the contract inspection links open.
          </p>
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <Label :for="confirmationInputId" class="font-medium"
          >Confirmation Count</Label
        >
        <div class="w-full space-y-2 sm:w-auto">
          <NumberField
            :min="1"
            :max="8"
            v-model="settingsStore.settings.confirmationCount"
          >
            <NumberFieldContent class="w-24">
              <NumberFieldDecrement />
              <NumberFieldInput
                :id="confirmationInputId"
                :aria-describedby="confirmationHelpId"
                placeholder="3"
              />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>

          <p :id="confirmationHelpId" class="text-muted-foreground text-xs">
            Number of block confirmations to wait for (1-8)
          </p>
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between gap-2">
          <Label :for="rpcInputId" class="flex items-center gap-2 font-medium">
            RPC URL
          </Label>
          <Badge
            variant="outline"
            v-if="
              rpcHealthCheckDuration > 0 && !runningHealthCheck && isRpcHealthy
            "
            class="text-xs"
          >
            {{ Math.round(rpcHealthCheckDuration) }}ms
          </Badge>
        </div>

        <div class="flex items-center">
          <LoaderCircle
            v-if="runningHealthCheck"
            class="text-muted-foreground mr-2 size-4 animate-spin"
          />
          <Input
            :id="rpcInputId"
            v-model="settingsStore.settings.rpcUrl"
            type="text"
            placeholder="https://"
            :aria-invalid="!isRpcHealthy"
            :aria-describedby="rpcStatusId"
          />
          <Button
            v-if="settingsStore.isUsingCustomRpcUrl"
            variant="ghost"
            size="icon"
            @click="settingsStore.resetRpcUrl"
            class="ml-1"
            :aria-label="'Reset RPC URL to default'"
          >
            <Undo2 class="text-muted-foreground size-4" />
          </Button>
        </div>
        <div
          :id="rpcStatusId"
          class="flex flex-col items-start gap-1 sm:items-end"
          role="status"
          aria-live="polite"
        >
          <div
            v-if="settingsStore.isUsingCustomRpcUrl"
            class="text-muted-foreground flex items-center gap-1 text-xs"
          >
            <TriangleAlert class="size-3 text-orange-500" />
            <span>Using custom RPC URL</span>
          </div>
          <div
            v-if="!isRpcHealthy"
            class="flex items-center gap-1 text-xs text-red-500"
          >
            <TriangleAlert class="size-3" />
            <span>Cannot reach RPC URL</span>
          </div>
        </div>
      </div>
    </div>

    <DialogFooter class="flex items-center">
      <div class="text-muted-foreground text-xs">
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  availableIndexers,
  useSettingsStore,
  type IndexerOption,
} from "@/stores/settingsStore";
import type { NetworkType } from "@airgap/beacon-types";
import { useDebounce } from "@vueuse/core";
import { LoaderCircle, TriangleAlert, Undo2 } from "lucide-vue-next";
import { computed, ref, watch } from "vue";

const emit = defineEmits(["close"]);

const settingsStore = useSettingsStore();

const indexers: IndexerOption[] = availableIndexers.filter((indexer) =>
  indexer.availableNetworks.includes(
    import.meta.env.VITE_NETWORK_TYPE as NetworkType,
  ),
);

const gitSha = import.meta.env.VITE_GITHUB_SHA;
const version = import.meta.env.VITE_VERSION;
const network = import.meta.env.VITE_NETWORK_TYPE;

const indexerSelectId = "settings-indexer-select";
const indexerHelpId = "settings-indexer-help";
const confirmationInputId = "settings-confirmation-count";
const confirmationHelpId = "settings-confirmation-help";
const rpcInputId = "settings-rpc-url";
const rpcStatusId = "settings-rpc-status";

const isRpcHealthy = ref(true);
const rpcHealthCheckDuration = ref(0);

const rpcUrlRef = computed(() => settingsStore.settings.rpcUrl);
const debouncedRpcUrl = useDebounce(rpcUrlRef, 500);
const runningHealthCheck = ref(false);

watch(debouncedRpcUrl, (newRpcUrl: string) => {
  const checkRpcHealth = async (url: string) => {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    runningHealthCheck.value = true;

    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${parsed}/chains/main/blocks/head/header`, {
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
    const startTime = performance.now();
    isRpcHealthy.value = await checkRpcHealth(newRpcUrl);
    const endTime = performance.now();
    const duration = endTime - startTime;
    rpcHealthCheckDuration.value = duration;
  })();
});
</script>
