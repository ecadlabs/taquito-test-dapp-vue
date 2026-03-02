<template>
  <TooltipProvider>
    <div class="flex w-full flex-col items-center gap-6">
      <!-- Block Selection -->
      <div class="flex flex-col items-center gap-4">
        <div class="flex items-center gap-4">
          <Button
            @click="fetchBlock(undefined)"
            :disabled="loading || !walletStore.getAddress"
            variant="outline"
            class="w-40"
          >
            <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            <p v-else>Latest Block</p>
          </Button>

          <div class="text-muted-foreground text-sm">or</div>

          <div class="flex items-center gap-2">
            <Label>Block Number:</Label>
            <NumberField
              :min="minBlockNumber"
              :max="latestBlockNumber"
              v-model="blockNumber"
              class="w-32"
            >
              <NumberFieldContent>
                <NumberFieldDecrement />
                <NumberFieldInput />
                <NumberFieldIncrement />
              </NumberFieldContent>
            </NumberField>
            <Button
              @click="fetchBlock(blockNumber)"
              :disabled="loading || !blockNumber || !walletStore.getAddress"
              class="w-24"
            >
              <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
              <p v-else>Fetch</p>
            </Button>
          </div>
        </div>
      </div>

      <!-- Transaction List -->
      <div
        v-if="transactionList.transactions.length > 0"
        class="w-full max-w-4xl"
      >
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <FileText class="h-5 w-5" />
              Block {{ transactionList.blockNumber }} Transactions
            </CardTitle>
            <CardDescription data-testid="transaction-count">
              {{ transactionList.transactionCount }} transaction{{
                transactionList.transactionCount !== 1 ? "s" : ""
              }}
              found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div
                v-for="(transaction, index) in transactionList.transactions"
                :key="index"
                class="flex items-center justify-between rounded-lg border p-4"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full"
                  >
                    <FileText class="text-primary h-4 w-4" />
                  </div>
                  <div>
                    <p class="font-medium">Transaction {{ index + 1 }}</p>
                    <p class="text-muted-foreground text-sm">
                      Fee: {{ formatFee((transaction as Transaction).fee) }} ꜩ
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <div class="text-muted-foreground text-right text-sm">
                    <div
                      v-if="(transaction as Transaction).source"
                      class="mb-1"
                    >
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <span class="cursor-help underline decoration-dotted">
                            From:
                            {{
                              (transaction as Transaction).source?.slice(0, 8)
                            }}...
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{{ (transaction as Transaction).source }}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div v-if="(transaction as Transaction).destination">
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <span class="cursor-help underline decoration-dotted">
                            To:
                            {{
                              (transaction as Transaction).destination?.slice(
                                0,
                                8,
                              )
                            }}...
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{{ (transaction as Transaction).destination }}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <Button
                    v-if="(transaction as Transaction).hash"
                    @click="openTransactionInTzkt(transaction as Transaction)"
                    variant="outline"
                    size="sm"
                    class="h-8 w-8 p-0"
                  >
                    <ExternalLink class="h-4 w-4" />
                    <span class="sr-only"
                      >Open in {{ settingsStore.settings.indexer.name }}</span
                    >
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!loading"
        class="flex flex-col items-center gap-4 text-center"
      >
        <div
          class="bg-muted flex h-16 w-16 items-center justify-center rounded-full"
        >
          <FileText class="text-muted-foreground h-8 w-8" />
        </div>
        <div>
          <h3 class="text-lg font-semibold">No Transactions Found</h3>
          <p class="text-muted-foreground">
            Fetch a block to view its transactions
          </p>
        </div>
      </div>
    </div>
  </TooltipProvider>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { buildIndexerUrl } from "@/lib/utils";
import {
  type Transaction,
  type TransactionList,
  getBlock,
} from "@/modules/tests/tests/viewing-blocks/viewing-blocks";
import { useDiagramStore } from "@/stores/diagramStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useWalletStore } from "@/stores/walletStore";
import { ExternalLink, FileText, Loader2 } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";

const walletStore = useWalletStore();
const settingsStore = useSettingsStore();
const diagramStore = useDiagramStore();

const blockNumber = ref<number>(1);
const latestBlockNumber = ref<number | undefined>(undefined);
const loading = ref<boolean>(false);
const transactionList = ref<TransactionList>({
  transactions: [],
  blockNumber: 0,
  transactionCount: 0,
});

const networkType = import.meta.env.VITE_NETWORK_TYPE;
const networkName = import.meta.env.VITE_NETWORK_NAME;

const minBlockNumber = computed(() => {
  if (!latestBlockNumber.value) return 1;
  return Math.max(1, latestBlockNumber.value - 10000);
});

const fetchLatestBlockNumber = async () => {
  try {
    const header = await walletStore.getTezos.rpc.getBlockHeader();
    latestBlockNumber.value = header.level;
    blockNumber.value = header.level;
  } catch (error) {
    console.error("Failed to fetch latest block number:", error);
  }
};

onMounted(async () => {
  diagramStore.setTestDiagram("viewing-blocks", "fetch-block");
  if (walletStore.getAddress) {
    await fetchLatestBlockNumber();
  }
});

const fetchBlock = async (blockNumber?: number) => {
  try {
    loading.value = true;
    const result = await getBlock(blockNumber ?? undefined);
    transactionList.value = result;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const formatFee = (fee: string | undefined): string => {
  if (!fee) return "N/A";

  const feeInTez = parseInt(fee, 10) / 1000000;
  return feeInTez.toFixed(6);
};

const openTransactionInTzkt = (transaction: Transaction) => {
  if (!transaction.hash) return;

  const tzktUrl = buildIndexerUrl(
    settingsStore.settings.indexer,
    networkType,
    transaction.hash,
    "operations",
    networkName,
  );

  window.open(tzktUrl, "_blank");
};
</script>
