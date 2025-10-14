<template>
  <div class="mb-4">
    <h3 class="mb-0.5 text-lg font-semibold">Deployed Contract Addresses</h3>
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
      <p>FA2 Token:</p>
      <p
        class="bg-muted h-fit w-fit rounded-md px-2 py-1 font-mono text-xs text-red-400"
      >
        {{ CONTRACT_ADDRESS }}
      </p>
      <OpenInExplorer :address="CONTRACT_ADDRESS" />
    </div>
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
      <p>Balance Callback:</p>
      <p
        class="bg-muted h-fit w-fit rounded-md px-2 py-1 font-mono text-xs text-red-400"
      >
        {{ CALLBACK_CONTRACT_ADDRESS }}
      </p>
      <OpenInExplorer :address="CALLBACK_CONTRACT_ADDRESS" />
    </div>
  </div>
  <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <!-- Token Balance Query Section -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Coins class="h-5 w-5" />
          Token Balance Query
        </CardTitle>
        <CardDescription>
          Query token balances for specific addresses and token IDs. You can
          pass multiple addresses and token IDs to query balances for multiple
          addresses and token IDs, but in this example we only allow inputting
          one.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label>Owner Address</Label>
            <Input
              v-model="balanceQuery.owner"
              placeholder="tz1..."
              :disabled="!walletConnected"
              autocapitalize="none"
              autocomplete="off"
              spellcheck="false"
              :aria-invalid="
                balanceQuery.owner.length > 0 &&
                !isValidAddress(balanceQuery.owner)
              "
            />
          </div>
          <div class="space-y-2">
            <Label>Token ID</Label>
            <Input
              v-model="balanceQuery.token_id"
              placeholder="0"
              type="text"
              :disabled="!walletConnected"
              inputmode="numeric"
              pattern="\\d*"
              :aria-invalid="!isValidTokenId(balanceQuery.token_id)"
            />
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <Button
            @click="queryBalanceWithCallback"
            :disabled="
              !walletConnected || !isValidBalanceQuery || isOperationRunning
            "
          >
            <Search class="mr-2 h-4 w-4" />
            Query Balance (Callback)
          </Button>
          <Button
            @click="queryBalanceDirect"
            :disabled="
              !walletConnected || !isValidBalanceQuery || isOperationRunning
            "
          >
            <Search class="mr-2 h-4 w-4" />
            Query Balance (Direct)
          </Button>
        </div>
        <div
          v-if="balanceResults.length > 0"
          class="space-y-2"
          role="status"
          aria-live="polite"
        >
          <h4 class="font-medium">Balance Results:</h4>
          <div class="space-y-1">
            <div
              v-for="result in balanceResults"
              :key="`${result.owner}-${result.token_id}`"
              class="bg-muted rounded-lg p-3 text-sm"
            >
              <div class="font-medium">Token ID: {{ result.token_id }}</div>
              <div class="text-muted-foreground">Owner: {{ result.owner }}</div>
              <div class="text-lg font-bold">
                Balance: {{ formatTokenAmount(result.balance) }}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Token Transfer Section -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <ArrowRightLeft class="h-5 w-5" />
          Token Transfer
        </CardTitle>
        <CardDescription>
          Transfer tokens between addresses. You can batch transfers together in
          a single transaction, but in this example we only allow inputting one.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label>From Address</Label>
            <Input
              v-model="transferForm.from_"
              placeholder="tz1..."
              :disabled="!walletConnected"
              autocapitalize="none"
              autocomplete="off"
              spellcheck="false"
              :aria-invalid="
                transferForm.from_.length > 0 &&
                !isValidAddress(transferForm.from_)
              "
            />
          </div>
          <div class="space-y-2">
            <Label>To Address</Label>
            <Input
              v-model="transferForm.to_"
              placeholder="tz1..."
              :disabled="!walletConnected"
              autocapitalize="none"
              autocomplete="off"
              spellcheck="false"
              :aria-invalid="
                transferForm.to_.length > 0 && !isValidAddress(transferForm.to_)
              "
            />
          </div>
        </div>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label>Token ID</Label>
            <Input
              v-model="transferForm.token_id"
              placeholder="0"
              type="text"
              :disabled="!walletConnected"
              inputmode="numeric"
              pattern="\\d*"
              :aria-invalid="!isValidTokenId(transferForm.token_id)"
            />
          </div>
          <div class="space-y-2">
            <Label>Amount</Label>
            <Input
              v-model="transferForm.amount"
              placeholder="100"
              type="text"
              data-testid="transfer-amount"
              :disabled="!walletConnected"
              inputmode="numeric"
              pattern="\\d*"
              :aria-invalid="
                transferForm.amount.length > 0 &&
                !isValidAmount(transferForm.amount)
              "
            />
          </div>
        </div>
        <div class="flex gap-2">
          <Button
            @click="executeTransfer"
            :disabled="
              !walletConnected || !isValidTransferForm || isOperationRunning
            "
          >
            <Send class="mr-2 h-4 w-4" />
            Transfer Tokens
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Mint Tokens Section -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <HandCoins class="h-5 w-5" />
          Mint Tokens
        </CardTitle>
        <CardDescription>
          Create new tokens and assign them to an address
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div class="space-y-2">
            <Label>To Address</Label>
            <Input
              v-model="mintForm.to_"
              placeholder="tz1..."
              :disabled="!walletConnected"
              autocapitalize="none"
              autocomplete="off"
              spellcheck="false"
              :aria-invalid="
                mintForm.to_.length > 0 && !isValidAddress(mintForm.to_)
              "
            />
          </div>
          <div class="space-y-2">
            <Label>Token ID</Label>
            <Input
              v-model="mintForm.token_id"
              placeholder="0"
              type="text"
              :disabled="!walletConnected"
              inputmode="numeric"
              pattern="\\d*"
              :aria-invalid="!isValidTokenId(mintForm.token_id)"
            />
          </div>
          <div class="space-y-2">
            <Label>Amount</Label>
            <Input
              v-model="mintForm.amount"
              placeholder="100"
              type="text"
              data-testid="mint-amount"
              :disabled="!walletConnected"
              inputmode="numeric"
              pattern="\\d*"
              :aria-invalid="
                mintForm.amount.length > 0 && !isValidAmount(mintForm.amount)
              "
            />
          </div>
        </div>
        <div class="flex gap-2">
          <Button
            @click="executeMint"
            :disabled="
              !walletConnected || !isValidMintForm || isOperationRunning
            "
          >
            <Plus class="mr-2 h-4 w-4" />
            Mint Tokens
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Burn Tokens Section -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Flame class="h-5 w-5" />
          Burn Tokens
        </CardTitle>
        <CardDescription>
          Destroy tokens from an address (reducing total supply)
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div class="space-y-2">
            <Label>From Address</Label>
            <Input
              v-model="burnForm.from_"
              placeholder="tz1..."
              :disabled="!walletConnected"
              autocapitalize="none"
              autocomplete="off"
              spellcheck="false"
              :aria-invalid="
                burnForm.from_.length > 0 && !isValidAddress(burnForm.from_)
              "
            />
          </div>
          <div class="space-y-2">
            <Label>Token ID</Label>
            <Input
              v-model="burnForm.token_id"
              placeholder="0"
              type="text"
              :disabled="!walletConnected"
              inputmode="numeric"
              pattern="\\d*"
              :aria-invalid="!isValidTokenId(burnForm.token_id)"
            />
          </div>
          <div class="space-y-2">
            <Label>Amount</Label>
            <Input
              v-model="burnForm.amount"
              placeholder="100"
              type="text"
              data-testid="burn-amount"
              :disabled="!walletConnected"
              inputmode="numeric"
              pattern="\\d*"
              :aria-invalid="
                burnForm.amount.length > 0 && !isValidAmount(burnForm.amount)
              "
            />
          </div>
        </div>
        <div class="flex gap-2">
          <Button
            variant="destructive"
            @click="executeBurn"
            :disabled="
              !walletConnected || !isValidBurnForm || isOperationRunning
            "
          >
            <Minus class="mr-2 h-4 w-4" />
            Burn Tokens
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import contracts from "@/contracts/contract-config.json";
import { validateTezosAddress } from "@/lib/utils";
import OpenInExplorer from "@/modules/tests/components/open-in-explorer.vue";
import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import type { ContractConfig } from "@/types/contract";
import {
  ArrowRightLeft,
  Coins,
  Flame,
  HandCoins,
  Minus,
  Plus,
  Search,
  Send,
} from "lucide-vue-next";
import { storeToRefs } from "pinia";
import { computed, onMounted, ref, watch } from "vue";
import {
  burnTokens,
  getTokenBalancesDirect,
  getTokenBalancesWithCallback,
  mintTokens,
  transferTokens,
  type BurnParam,
  type MintParam,
  type TokenBalance,
  type TransferParam,
} from "./fa2-token";

const diagramStore = useDiagramStore();
const walletStore = useWalletStore();
const { getAddress } = storeToRefs(walletStore);

const walletConnected = computed(() => !!getAddress.value);

const isOperationRunning = computed(
  () => diagramStore.diagramStatus === "running",
);

// Balance query state
const balanceQuery = ref({
  owner: "",
  token_id: "0",
});
const balanceResults = ref<TokenBalance[]>([]);

// Transfer form state
const transferForm = ref({
  from_: "",
  to_: "",
  token_id: "0",
  amount: "",
});

// Mint form state
const mintForm = ref({
  to_: "",
  token_id: "0",
  amount: "",
});

// Burn form state
const burnForm = ref({
  from_: "",
  token_id: "0",
  amount: "",
});

// Helper validation functions
const isValidAddress = (value: string): boolean =>
  validateTezosAddress(value.trim());
const isValidTokenId = (tokenId: string): boolean =>
  /^\d+$/.test(tokenId.trim());
const isValidAmount = (amount: string): boolean => {
  const trimmed = amount.trim();
  return /^\d+$/.test(trimmed) && parseInt(trimmed) > 0;
};

// Computed validations
const isValidBalanceQuery = computed(
  () =>
    isValidAddress(balanceQuery.value.owner) &&
    isValidTokenId(balanceQuery.value.token_id),
);

const isValidTransferForm = computed(
  () =>
    isValidAddress(transferForm.value.from_) &&
    isValidAddress(transferForm.value.to_) &&
    isValidTokenId(transferForm.value.token_id) &&
    isValidAmount(transferForm.value.amount),
);

const isValidMintForm = computed(
  () =>
    isValidAddress(mintForm.value.to_) &&
    isValidTokenId(mintForm.value.token_id) &&
    isValidAmount(mintForm.value.amount),
);

const isValidBurnForm = computed(
  () =>
    isValidAddress(burnForm.value.from_) &&
    isValidTokenId(burnForm.value.token_id) &&
    isValidAmount(burnForm.value.amount),
);

// Helper functions
const formatTokenAmount = (amount: string): string => {
  const decimals = 2; // Using 2 decimals for the test token

  // Handle empty or invalid amounts
  if (!amount || amount === "0") {
    return "0.00";
  }

  // Convert string to number more safely
  const amountNum = Number(amount);
  if (isNaN(amountNum)) {
    console.error("Invalid amount for formatting:", amount);
    return "Invalid Amount";
  }

  const formattedAmount = amountNum / Math.pow(10, decimals);
  return formattedAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Balance query functions
const queryBalanceWithCallback = async (): Promise<void> => {
  if (!isValidBalanceQuery.value) return;

  const results = await getTokenBalancesWithCallback([
    {
      owner: balanceQuery.value.owner,
      token_id: balanceQuery.value.token_id,
    },
  ]);

  balanceResults.value = results;
};

const queryBalanceDirect = async (): Promise<void> => {
  if (!isValidBalanceQuery.value) return;

  const results = await getTokenBalancesDirect([
    {
      owner: balanceQuery.value.owner,
      token_id: balanceQuery.value.token_id,
    },
  ]);

  balanceResults.value = results;
};

// Transfer functions
const executeTransfer = async (): Promise<void> => {
  if (!isValidTransferForm.value) return;

  const transfers: TransferParam[] = [
    {
      from_: transferForm.value.from_,
      txs: [
        {
          to_: transferForm.value.to_,
          token_id: transferForm.value.token_id,
          amount: transferForm.value.amount,
        },
      ],
    },
  ];

  await transferTokens(transfers);
};

// Admin functions
const executeMint = async (): Promise<void> => {
  if (!isValidMintForm.value) return;

  const mintParam: MintParam = {
    to_: mintForm.value.to_,
    token_id: mintForm.value.token_id,
    amount: mintForm.value.amount,
  };

  await mintTokens(mintParam);
};

const executeBurn = async (): Promise<void> => {
  if (!isValidBurnForm.value) return;

  const burnParam: BurnParam = {
    from_: burnForm.value.from_,
    token_id: burnForm.value.token_id,
    amount: burnForm.value.amount,
  };

  await burnTokens(burnParam);
};

// Initialize component
onMounted(() => {
  diagramStore.setTestDiagram("fa2-token");

  // Pre-fill user's address where appropriate
  const userAddress = getAddress.value;
  if (userAddress) {
    balanceQuery.value.owner = userAddress;
    transferForm.value.from_ = userAddress;
    transferForm.value.to_ = userAddress;
    mintForm.value.to_ = userAddress;
    burnForm.value.from_ = userAddress;
  }
});

// Watch for wallet address changes and update form fields
watch(
  getAddress,
  (newAddress: string | undefined) => {
    if (newAddress) {
      // Update all address fields when user logs in
      balanceQuery.value.owner = newAddress;
      transferForm.value.from_ = newAddress;
      transferForm.value.to_ = newAddress;
      mintForm.value.to_ = newAddress;
      burnForm.value.from_ = newAddress;
    } else {
      // Clear address fields when user logs out
      balanceQuery.value.owner = "";
      transferForm.value.from_ = "";
      transferForm.value.to_ = "";
      mintForm.value.to_ = "";
      burnForm.value.from_ = "";
    }
  },
  { immediate: false }, // Don't trigger immediately since onMounted handles initial state
);

const CONTRACT_ADDRESS =
  (contracts as ContractConfig[]).find(
    (contract: ContractConfig) => contract.contractName === "fa2-token",
  )?.address ?? "";

const CALLBACK_CONTRACT_ADDRESS =
  (contracts as ContractConfig[]).find(
    (contract: ContractConfig) => contract.contractName === "balance-callback",
  )?.address ?? "";
</script>
