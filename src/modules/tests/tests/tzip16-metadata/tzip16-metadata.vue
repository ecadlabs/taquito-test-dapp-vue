<template>
  <div class="flex flex-col items-center w-full gap-6">
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
            />
            <Button
              @click="getMetadata"
              :disabled="!walletConnected || isLoading || !contractAddress"
              data-testid="get-metadata-button"
            >
              <Loader2 v-if="isLoading" class="w-4 h-4 mr-2 animate-spin" />
              <Database v-else class="w-4 h-4 mr-2" />
              Get Metadata
            </Button>
          </div>
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
              class="text-sm font-mono bg-muted p-3 rounded-lg text-red-400 overflow-auto max-h-96"
            >
              <pre class="whitespace-pre-wrap break-words">{{
                JSON.stringify(metadataResult, null, 2)
              }}</pre>
            </div>
          </div>
          <div
            v-if="metadataResult.metadata"
            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
          >
            <div v-if="metadataResult.metadata.name" class="space-y-1">
              <Label class="text-sm font-medium text-muted-foreground"
                >Name</Label
              >
              <p class="text-sm">{{ metadataResult.metadata.name }}</p>
            </div>
            <div v-if="metadataResult.metadata.description" class="space-y-1">
              <Label class="text-sm font-medium text-muted-foreground"
                >Description</Label
              >
              <p class="text-sm">{{ metadataResult.metadata.description }}</p>
            </div>
            <div v-if="metadataResult.metadata.version" class="space-y-1">
              <Label class="text-sm font-medium text-muted-foreground"
                >Version</Label
              >
              <p class="text-sm">{{ metadataResult.metadata.version }}</p>
            </div>
            <div v-if="metadataResult.metadata.license" class="space-y-1">
              <Label class="text-sm font-medium text-muted-foreground"
                >License</Label
              >
              <p class="text-sm">{{ metadataResult.metadata.license }}</p>
            </div>
            <div v-if="metadataResult.metadata.authors" class="space-y-1">
              <Label class="text-sm font-medium text-muted-foreground"
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
              <Label class="text-sm font-medium text-muted-foreground"
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

      <!-- Views Section -->
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
            Metadata Views
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <div
              v-for="(view, index) in metadataResult.metadata.views"
              :key="index"
              class="p-3 border rounded-lg"
            >
              <div class="flex items-center gap-2">
                <Badge variant="outline">{{
                  getViewName(view as string)
                }}</Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  @click="executeView(getViewName(view as string), index)"
                  :disabled="isExecutingView"
                >
                  <Play class="w-3 h-3 mr-1" />
                  Execute
                </Button>
              </div>
              <pre
                v-if="viewExecutionResult[index]"
                class="mt-2 text-xs bg-muted p-2 rounded w-full break-words whitespace-pre-wrap"
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
import { computed, onMounted, ref } from "vue";
import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import Button from "@/components/ui/button/Button.vue";
import Input from "@/components/ui/input/Input.vue";
import Label from "@/components/ui/label/Label.vue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Loader2, Info, Eye, Play } from "lucide-vue-next";
import {
  getContractMetadata,
  executeMetadataView,
  type MetadataResult,
} from "./tzip16-metadata";
import contracts from "@/contracts/contract-config.json";
import type { ContractConfig } from "@/types/contract";
import { Tzip16Module } from "@taquito/tzip16";

const diagramStore = useDiagramStore();
const walletStore = useWalletStore();

const walletConnected = computed(() => !!walletStore.getAddress);
const isLoading = ref(false);
const isExecutingView = ref(false);
const contractAddress = ref("");
const metadataResult = ref<MetadataResult | undefined>(undefined);
const viewExecutionResult = ref<string[]>([]);

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
  if (!contractAddress.value.trim()) return;

  isLoading.value = true;

  try {
    metadataResult.value = await getContractMetadata(
      contractAddress.value.trim(),
    );
    console.log(`Metadata result:`, { ...metadataResult.value?.metadata });
  } finally {
    isLoading.value = false;
  }
};

const executeView = async (viewName: string, index: number) => {
  if (!contractAddress.value.trim()) return;

  isExecutingView.value = true;

  try {
    const result = await executeMetadataView(
      contractAddress.value.trim(),
      viewName,
    );
    viewExecutionResult.value[index] = JSON.stringify(
      (result as any).result,
      null,
      2,
    );
  } catch (error) {
    console.error(`Failed to execute view ${viewName}:`, error);
  } finally {
    isExecutingView.value = false;
  }
};

const getViewName = (view: string): string => {
  return view.replace(/"/g, "");
};
</script>
