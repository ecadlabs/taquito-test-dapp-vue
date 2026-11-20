<template>
  <div class="flex w-full flex-col items-center gap-4">
    <p
      v-if="!isBeacon"
      class="text-muted-foreground max-w-xl text-center text-sm"
      data-testid="large-payload-beacon-only"
    >
      Connect a Beacon wallet. This page measures Beacon transport, so other
      wallet types have nothing to time.
    </p>

    <div class="flex flex-wrap items-end justify-center gap-4">
      <div>
        <Label class="mb-1" :for="sizeSelectId">Payload size</Label>
        <Select v-model="sizeKib">
          <SelectTrigger :id="sizeSelectId" class="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem
                v-for="kib in PAYLOAD_SIZES_KIB"
                :key="kib"
                :value="String(kib)"
              >
                {{ kib }} KiB
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label class="mb-1" :for="buildInputId">Wallet build</Label>
        <Input
          :id="buildInputId"
          v-model="walletBuild"
          placeholder="e.g. Kukai beta.6 local"
          class="w-56"
          autocomplete="off"
          spellcheck="false"
          data-testid="large-payload-wallet-build"
        />
      </div>
    </div>

    <div class="flex flex-wrap justify-center gap-2">
      <Button
        :disabled="!canRun"
        class="w-48"
        data-testid="large-payload-sign-button"
        @click="run('sign')"
      >
        <Loader2 v-if="running === 'sign'" class="mr-2 h-4 w-4 animate-spin" />
        <span v-else>Sign payload</span>
      </Button>
      <Button
        :disabled="!canRun || !sinkAddress"
        class="w-48"
        data-testid="large-payload-operation-button"
        @click="run('operation')"
      >
        <Loader2
          v-if="running === 'operation'"
          class="mr-2 h-4 w-4 animate-spin"
        />
        <span v-else>Operation request</span>
      </Button>
    </div>

    <p
      v-if="!sinkAddress"
      class="text-muted-foreground max-w-xl text-center text-sm"
    >
      Operation requests need the <code>large-payload-sink</code> contract,
      which is not deployed on this network.
    </p>
    <p
      v-else-if="operationOverLimit"
      class="max-w-xl text-center text-sm text-amber-600 dark:text-amber-400"
      data-testid="large-payload-limit-warning"
    >
      A {{ sizeKib }} KiB parameter exceeds the 32 KiB operation limit. Wallets
      simulate it and show it for approval, but the node rejects it at
      injection. Reject it in the wallet once the confirmation screen appears.
    </p>

    <p class="text-muted-foreground max-w-2xl text-center text-xs">
      <strong>Dispatch</strong> is the dApp encoding the request and the
      transport accepting it; on Matrix that includes the upload to the relay.
      <strong>To ack</strong> runs from the same start until the wallet
      acknowledges, so it adds delivery and the wallet's decode, with no human
      involved. It is the number to compare across SDK versions. WalletConnect
      only reports relay status, so it has no wallet ack.
      <strong>To response</strong> includes the time spent approving, plus any
      wallet-side checks that run after the ack.
    </p>

    <div v-if="results.length" class="w-full overflow-x-auto">
      <table class="mx-auto text-sm" data-testid="large-payload-results">
        <thead>
          <tr class="text-left">
            <th class="px-2">Kind</th>
            <th class="px-2 text-right">KiB</th>
            <th class="px-2">Transport</th>
            <th class="px-2">Wallet</th>
            <th class="px-2">Build</th>
            <th class="px-2 text-right">Dispatch ms</th>
            <th class="px-2 text-right">To ack ms</th>
            <th class="px-2 text-right">To response ms</th>
            <th class="px-2">Outcome</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="result in results" :key="result.startedAt">
            <td class="px-2">{{ result.kind }}</td>
            <td class="px-2 text-right">{{ result.sizeBytes / 1024 }}</td>
            <td class="px-2">{{ result.transport ?? "?" }}</td>
            <td class="px-2">{{ result.walletName ?? "?" }}</td>
            <td class="px-2">{{ result.walletBuild }}</td>
            <td class="px-2 text-right">
              {{ result.timing?.dispatchMs ?? "" }}
            </td>
            <td class="px-2 text-right">{{ ackLabel(result) }}</td>
            <td class="px-2 text-right">
              {{ result.timing?.toResponseMs ?? "" }}
            </td>
            <td class="max-w-64 truncate px-2" :title="result.detail">
              {{
                result.outcome === "approved"
                  ? "approved"
                  : `failed: ${result.detail}`
              }}
              <span v-if="result.overInjectionLimit">(over 32 KiB)</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="mt-2 flex justify-center gap-2">
        <Button variant="outline" size="sm" @click="copyResults()">
          <Copy class="mr-2 h-4 w-4" aria-hidden="true" />
          Copy as Markdown
        </Button>
        <Button variant="ghost" size="sm" @click="results = []">Clear</Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getContractAddress } from "@/networks/network-registry";
import { useWalletStore } from "@/stores/walletStore";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { Copy, Loader2 } from "lucide-vue-next";
import { computed, ref, useId } from "vue";
import { toast } from "vue-sonner";

import {
  resultsToMarkdown,
  runLargePayloadRequest,
  type RequestKind,
  type RunResult,
} from "./large-payload";
import { PAYLOAD_SIZES_KIB, exceedsOperationLimit } from "./payloads";

const NETWORK_ID =
  import.meta.env.VITE_NETWORK_NAME || import.meta.env.VITE_NETWORK_TYPE;

const walletStore = useWalletStore();
const sizeSelectId = useId();
const buildInputId = useId();

const sizeKib = ref<string>("16");
const walletBuild = ref<string>("");
const running = ref<RequestKind | null>(null);
const results = ref<RunResult[]>([]);

const sinkAddress = getContractAddress("large-payload-sink", NETWORK_ID);

const beaconWallet = computed(() => {
  const wallet = walletStore.getWallet;
  return wallet instanceof BeaconWallet ? wallet : undefined;
});
const isBeacon = computed(() => beaconWallet.value !== undefined);
const canRun = computed(
  () => isBeacon.value && !!walletStore.getAddress && running.value === null,
);
const operationOverLimit = computed(() =>
  exceedsOperationLimit(Number(sizeKib.value) * 1024),
);

const ackLabel = (result: RunResult): string => {
  if (!result.timing) return "no SENT event";
  switch (result.timing.ackSource) {
    case "wallet-ack":
      return String(result.timing.toAckMs);
    case "relay-status-only":
      return "relay status only";
    case "no-ack":
      return "no ack";
  }
};

const run = async (kind: RequestKind) => {
  const wallet = beaconWallet.value;
  const sourceAddress = walletStore.getAddress;
  if (!wallet || !sourceAddress) return;

  running.value = kind;
  try {
    const result = await runLargePayloadRequest({
      wallet,
      tezos: walletStore.getTezos,
      kind,
      sizeBytes: Number(sizeKib.value) * 1024,
      sourceAddress,
      sinkAddress,
      walletBuild: walletBuild.value.trim(),
    });
    results.value = [result, ...results.value];
  } finally {
    running.value = null;
  }
};

const copyResults = async () => {
  // Rows display newest first; the pasted table reads oldest first.
  await navigator.clipboard.writeText(
    resultsToMarkdown([...results.value].reverse()),
  );
  toast.success("Results copied");
};
</script>
