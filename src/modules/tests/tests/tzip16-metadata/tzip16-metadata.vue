<template>
  <div class="flex w-full flex-col items-center gap-6">
    <!-- Contract Address Input Section -->
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
              <Database v-else class="mr-2 h-4 w-4" />
              Get Metadata
            </Button>
          </div>
        </div>
      </div>
      <div>
        <h3 class="mb-1 font-medium">Metadata in Storage Contract</h3>
        <div>
          <p
            class="bg-muted w-fit rounded-md px-2 py-1 font-mono text-xs text-red-400"
          >
            {{ METADATA_CONTRACT_ADDRESS }}
          </p>
          <OpenInExplorer :address="METADATA_CONTRACT_ADDRESS" />
        </div>
      </div>
      <div>
        <h3 class="mb-1 font-medium">Metadata via HTTPS Contract</h3>
        <div>
          <p
            class="bg-muted w-fit rounded-md px-2 py-1 font-mono text-xs text-red-400"
          >
            {{ METADATA_HTTPS_CONTRACT_ADDRESS }}
          </p>
          <OpenInExplorer :address="METADATA_HTTPS_CONTRACT_ADDRESS" />
        </div>
      </div>
    </div>

    <!-- Metadata Display Section -->
    <div v-if="metadataResult" class="w-full max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Info class="h-5 w-5" />
            Contract Metadata
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="w-full">
            <div
              class="bg-muted max-h-96 overflow-auto rounded-lg p-3 font-mono text-sm text-red-400"
              role="region"
              aria-live="polite"
              aria-label="Contract metadata JSON"
            >
              <pre class="break-words whitespace-pre-wrap">{{
                JSON.stringify(metadataResult, null, 2)
              }}</pre>
            </div>
          </div>
          <div
            v-if="metadataResult.metadata"
            class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"
          >
            <div v-if="metadataResult.metadata.name" class="space-y-1">
              <Label class="text-muted-foreground text-sm font-medium"
                >Name</Label
              >
              <p class="text-sm">{{ metadataResult.metadata.name }}</p>
            </div>
            <div v-if="metadataResult.metadata.description" class="space-y-1">
              <Label class="text-muted-foreground text-sm font-medium"
                >Description</Label
              >
              <p class="text-sm">{{ metadataResult.metadata.description }}</p>
            </div>
            <div v-if="metadataResult.metadata.version" class="space-y-1">
              <Label class="text-muted-foreground text-sm font-medium"
                >Version</Label
              >
              <p class="text-sm">{{ metadataResult.metadata.version }}</p>
            </div>
            <div v-if="metadataResult.metadata.license" class="space-y-1">
              <Label class="text-muted-foreground text-sm font-medium"
                >License</Label
              >
              <p class="text-sm">{{ metadataResult.metadata.license }}</p>
            </div>
            <div v-if="metadataResult.metadata.authors" class="space-y-1">
              <Label class="text-muted-foreground text-sm font-medium"
                >Authors</Label
              >
              <div class="flex flex-wrap gap-1">
                <Badge
                  v-for="author in metadataResult.metadata.authors"
                  :key="author"
                  variant="secondary"
                >
                  {{ author }}
                </Badge>
              </div>
            </div>
            <div v-if="metadataResult.metadata.interfaces" class="space-y-1">
              <Label class="text-muted-foreground text-sm font-medium"
                >Interfaces</Label
              >
              <div class="flex flex-wrap gap-1">
                <Badge
                  v-for="interface_ in metadataResult.metadata.interfaces"
                  :key="interface_"
                  variant="outline"
                >
                  {{ interface_ }}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
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
import { Tzip16Module } from "@taquito/tzip16";
import { Database, Info, Loader2 } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import { getContractMetadata, type MetadataResult } from "./tzip16-metadata";

const diagramStore = useDiagramStore();
const walletStore = useWalletStore();

const walletConnected = computed(() => !!walletStore.getAddress);
const isLoading = ref(false);
const contractAddress = ref("");
const metadataResult = ref<MetadataResult | undefined>(undefined);
const isValidContractAddress = (value: string): boolean =>
  validateTezosAddress(value.trim());

onMounted(() => {
  diagramStore.setTestDiagram("tzip16-metadata");

  const Tezos = walletStore.getTezos;
  Tezos.addExtension(new Tzip16Module());

  // Pre-fill with metadata contract address if available
  const metadataContract = (contracts as ContractConfig[]).find(
    (contract: ContractConfig) => contract.contractName === "metadata",
  );
  if (metadataContract?.address) {
    contractAddress.value = metadataContract.address;
  }
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

const METADATA_CONTRACT_ADDRESS =
  (contracts as ContractConfig[]).find(
    (contract: ContractConfig) => contract.contractName === "metadata",
  )?.address ?? "";

const METADATA_HTTPS_CONTRACT_ADDRESS =
  (contracts as ContractConfig[]).find(
    (contract: ContractConfig) => contract.contractName === "metadata-https",
  )?.address ?? "";
</script>
