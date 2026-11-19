<template>
  <DialogContent class="max-h-[90dvh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Settings</DialogTitle>
    </DialogHeader>

    <div class="min-w-0 space-y-4">
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
        <Label :for="themeSelectId" class="font-medium">Theme</Label>
        <div class="w-full space-y-2 sm:w-auto">
          <Select v-model="settingsStore.settings.themeMode">
            <SelectTrigger
              :id="themeSelectId"
              :aria-describedby="themeHelpId"
              class="w-full sm:w-[220px]"
            >
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <p :id="themeHelpId" class="text-muted-foreground text-xs">
            Applies to both the Playground and Beacon wallet modals/toasts.
          </p>
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between gap-2">
          <Label :for="beaconLocaleSelectId" class="font-medium"
            >Beacon Language</Label
          >
          <Badge variant="outline" class="font-mono text-xs">
            {{ resolvedBeaconSummary }}
          </Badge>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <Select v-model="settingsStore.settings.beaconLocale">
            <SelectTrigger
              :id="beaconLocaleSelectId"
              :aria-describedby="beaconLocaleHelpId"
              class="w-full"
            >
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="auto">
                  Auto (Browser{{ browserLocale ? `: ${browserLocale}` : "" }})
                </SelectItem>
                <SelectItem
                  v-for="locale in beaconLocales"
                  :key="locale.locale"
                  :value="locale.locale"
                >
                  {{ locale.name }} ({{ locale.locale
                  }}{{ locale.direction === "rtl" ? ", RTL" : "" }})
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <div class="flex flex-col gap-1.5">
            <Label :for="beaconDirectionSelectId" class="text-xs font-medium"
              >Text Direction</Label
            >
            <Select v-model="settingsStore.settings.beaconDirection">
              <SelectTrigger
                :id="beaconDirectionSelectId"
                :aria-describedby="beaconLocaleHelpId"
                class="w-full"
              >
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="auto">Auto (from locale)</SelectItem>
                  <SelectItem value="ltr">LTR (Left-to-Right)</SelectItem>
                  <SelectItem value="rtl">RTL (Right-to-Left)</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        <p :id="beaconLocaleHelpId" class="text-muted-foreground text-xs">
          Controls Beacon pairing screens, toasts, and error copy (supports
          Arabic RTL).
        </p>
      </div>
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between gap-2">
          <Label :for="rpcInputId" class="flex items-center gap-2 font-medium">
            RPC URL
          </Label>
          <div
            v-if="!runningHealthCheck && isRpcHealthy"
            class="flex items-center gap-1"
          >
            <Badge
              v-if="rpcBlockLevel !== null"
              variant="outline"
              class="text-xs"
            >
              Block #{{ rpcBlockLevel.toLocaleString("en-US") }}
            </Badge>
            <Badge
              v-if="rpcHealthCheckDuration > 0"
              variant="outline"
              class="text-xs"
            >
              {{ Math.round(rpcHealthCheckDuration) }}ms
            </Badge>
          </div>
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
            variant="ghost"
            size="icon"
            @click="settingsStore.checkRpcHealth()"
            :disabled="runningHealthCheck"
            class="ml-1"
            aria-label="Check RPC health"
          >
            <RefreshCw
              class="text-muted-foreground size-4"
              :class="{ 'animate-spin': runningHealthCheck }"
            />
          </Button>
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
            <span>{{
              rpcHealthError
                ? `Cannot reach RPC URL (${rpcHealthError})`
                : "Cannot reach RPC URL"
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="text-muted-foreground min-w-0 text-xs">
      <a
        :href="versionUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:underline"
        >Version {{ version }}</a
      >
      <p>Taquito: {{ taquitoVersion }}</p>
      <p>Network: {{ network }}</p>
      <p class="truncate">
        Git SHA:
        <a
          :href="shaUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:underline"
          >{{ gitSha }}</a
        >
      </p>
    </div>

    <DialogFooter class="flex items-center">
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
import { getBeaconLocaleOptions } from "@/lib/beaconAppearance";
import {
  availableIndexers,
  useSettingsStore,
  type IndexerOption,
} from "@/stores/settingsStore";
import {
  detectBrowserLocale,
  getBeaconDirection,
  resolveBeaconLang,
  subscribeBeaconI18n,
  type NetworkType,
} from "@taquito/beacon-wallet/types";
import { version as taquitoVersion } from "@taquito/taquito/package.json";
import { LoaderCircle, RefreshCw, TriangleAlert, Undo2 } from "lucide-vue-next";
import { computed, onUnmounted, ref, useId } from "vue";

const emit = defineEmits(["close"]);

const settingsStore = useSettingsStore();

const indexers: IndexerOption[] = availableIndexers.filter((indexer) =>
  indexer.availableNetworks.includes(
    import.meta.env.VITE_NETWORK_TYPE as NetworkType,
  ),
);

const beaconLocales = getBeaconLocaleOptions();
const browserLocale = detectBrowserLocale();

const formatResolvedBeaconSummary = () =>
  `${resolveBeaconLang()} · ${getBeaconDirection().toUpperCase()}`;

const resolvedBeaconSummary = ref(formatResolvedBeaconSummary());
const unsubscribeBeaconI18n = subscribeBeaconI18n(() => {
  resolvedBeaconSummary.value = formatResolvedBeaconSummary();
});

onUnmounted(() => {
  unsubscribeBeaconI18n();
});

const gitSha = import.meta.env.VITE_GITHUB_SHA;
const version = import.meta.env.VITE_VERSION;
const network = import.meta.env.VITE_NETWORK_TYPE;

const indexerSelectId = useId();
const indexerHelpId = useId();
const confirmationInputId = useId();
const confirmationHelpId = useId();
const themeSelectId = useId();
const themeHelpId = useId();
const beaconLocaleSelectId = useId();
const beaconDirectionSelectId = useId();
const beaconLocaleHelpId = useId();
const rpcInputId = useId();
const rpcStatusId = useId();

const isRpcHealthy = computed(() => settingsStore.isRpcHealthy);
const rpcHealthCheckDuration = computed(
  () => settingsStore.rpcHealthCheckDuration,
);
const rpcBlockLevel = computed(() => settingsStore.rpcBlockLevel);
const rpcHealthError = computed(() => settingsStore.rpcHealthError);
const runningHealthCheck = computed(() => settingsStore.runningHealthCheck);

const versionUrl = `https://github.com/ecadlabs/taquito-test-dapp-vue/releases/tag/${version}`;
const shaUrl = `https://github.com/ecadlabs/taquito-test-dapp-vue/commit/${gitSha}`;
</script>
