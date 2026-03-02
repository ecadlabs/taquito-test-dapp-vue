<template>
  <div class="flex w-full flex-col items-center gap-6">
    <div class="w-full max-w-2xl space-y-4">
      <div class="grid grid-cols-1 gap-4">
        <div class="space-y-2">
          <Label for="contract-address">Contract Address</Label>
          <div class="flex gap-2">
            <Input
              id="contract-address"
              v-model="contractAddress"
              placeholder="KT1..."
              class="flex-1"
              data-testid="contract-address-input"
              autocapitalize="none"
              autocomplete="off"
              spellcheck="false"
              :aria-invalid="!isValidContractAddress"
            />
            <Button
              @click="getMetadata"
              :disabled="
                !walletConnected || isLoading || !isValidContractAddress
              "
              data-testid="get-metadata-button"
            >
              <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
              <Eye v-else class="mr-2 h-4 w-4" />
              Get Views
            </Button>
          </div>
        </div>
      </div>
      <div>
        <h3 class="mb-1 font-medium">Default Contract Address</h3>
        <div>
          <p
            class="bg-muted w-fit rounded-md px-2 py-1 font-mono text-xs text-red-400"
          >
            {{ METADATA_CONTRACT_ADDRESS }}
          </p>
          <OpenInExplorer :address="METADATA_CONTRACT_ADDRESS" />
        </div>
      </div>
    </div>

    <div v-if="metadataResult" class="w-full max-w-4xl space-y-6">
      <Card
        v-if="
          metadataResult.metadata?.views &&
          Array.isArray(metadataResult.metadata.views) &&
          metadataResult.metadata.views.length > 0
        "
      >
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Eye class="h-5 w-5" />
            Contract Views
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <div
              v-for="(view, index) in metadataResult.metadata.views"
              :key="index"
              class="rounded-lg border p-3"
            >
              <div class="flex items-center gap-2">
                <Badge variant="outline">{{
                  getViewName(view as string)
                }}</Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  @click="
                    executeViewHandler(getViewName(view as string), index)
                  "
                  :disabled="isExecutingView"
                >
                  <Loader2
                    v-if="isExecutingView"
                    class="mr-1 h-3 w-3 animate-spin"
                  />
                  <Play v-else class="mr-1 h-3 w-3" />
                  Execute
                </Button>
              </div>
              <pre
                v-if="viewExecutionResult[index]"
                class="bg-muted mt-2 w-full rounded p-2 text-xs break-words whitespace-pre-wrap"
                >{{ viewExecutionResult[index] }}</pre
              >
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import Button from "@/components/ui/button/Button.vue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Input from "@/components/ui/input/Input.vue";
import Label from "@/components/ui/label/Label.vue";
import contracts from "@/contracts/contract-config.json";
import { validateTezosAddress } from "@/lib/utils";
import OpenInExplorer from "@/modules/tests/components/open-in-explorer.vue";
import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import type { ContractConfig } from "@/types/contract";
import { Tzip16Module, tzip16 } from "@taquito/tzip16";
import { Eye, Loader2, Play } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import {
  executeView as executeViewFunction,
  type ViewExecutionResult,
} from "./contract-views";

interface ContractMetadata {
  name?: string;
  description?: string;
  version?: string;
  license?: string;
  authors?: string[];
  homepage?: string;
  interfaces?: string[];
  views?: unknown[];
  [key: string]: unknown;
}

interface MetadataResult {
  metadata: ContractMetadata;
}

const getContractMetadata = async (
  contractAddress: string,
): Promise<MetadataResult | undefined> => {
  const diagramStore = useDiagramStore();
  const walletStore = useWalletStore();

  diagramStore.setTestDiagram("contract-views", "get-metadata");

  try {
    const Tezos = walletStore.getTezos;

    diagramStore.setProgress("get-contract");

    const contract = await Tezos.wallet.at(contractAddress, tzip16);

    diagramStore.setProgress("retrieve-metadata");
    const metadata = (await contract.tzip16().getMetadata()).metadata;

    diagramStore.setCompleted();

    return {
      metadata: metadata as ContractMetadata,
    };
  } catch (error) {
    console.error(
      `Error retrieving metadata: ${JSON.stringify(error, null, 2)}`,
    );
    diagramStore.setErrorMessage(error);
  }
};

const diagramStore = useDiagramStore();
const walletStore = useWalletStore();

const walletConnected = computed(() => !!walletStore.getAddress);
const isLoading = ref(false);
const isExecutingView = ref(false);
const contractAddress = ref("");
const metadataResult = ref<MetadataResult | undefined>(undefined);
const viewExecutionResult = ref<string[]>([]);
const isValidContractAddress = (value: string): boolean =>
  validateTezosAddress(value.trim());

onMounted(() => {
  diagramStore.setTestDiagram("contract-views");

  const Tezos = walletStore.getTezos;
  Tezos.addExtension(new Tzip16Module());

  contractAddress.value = METADATA_CONTRACT_ADDRESS;
});

const getMetadata = async () => {
  if (!isValidContractAddress(contractAddress.value.trim())) return;

  isLoading.value = true;

  try {
    metadataResult.value = await getContractMetadata(
      contractAddress.value.trim(),
    );
  } finally {
    isLoading.value = false;
  }
};

const executeViewHandler = async (viewName: string, index: number) => {
  if (!isValidContractAddress(contractAddress.value.trim())) return;

  isExecutingView.value = true;

  try {
    const result: ViewExecutionResult = await executeViewFunction(
      contractAddress.value.trim(),
      viewName,
    );
    viewExecutionResult.value[index] = JSON.stringify(result.result, null, 2);
  } catch (error) {
    console.error(`Failed to execute view ${viewName}:`, error);
  } finally {
    isExecutingView.value = false;
  }
};

const getViewName = (view: string): string => {
  return view.replace(/"/g, "");
};

const METADATA_CONTRACT_ADDRESS =
  (contracts as ContractConfig[]).find(
    (contract: ContractConfig) => contract.contractName === "metadata",
  )?.address ?? "";
</script>
