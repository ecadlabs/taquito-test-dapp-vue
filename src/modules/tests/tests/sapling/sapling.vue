<template>
  <div class="flex w-full flex-col gap-6">
    <div class="mx-auto w-full max-w-4xl space-y-6">
      <Alert>
        <AlertTitle class="flex items-center gap-2">
          <TriangleAlert class="size-4" />
          Heads up!
        </AlertTitle>
        <AlertDescription>
          Shield, transfer, and unshield operations take 10-30 seconds to
          complete due to the need to generate zero-knowledge proofs. The page
          may freeze for a few seconds during this time.
        </AlertDescription>
      </Alert>
      <!-- Sapling Addresses -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Key class="size-4" />
            Sapling Addresses
          </CardTitle>
          <CardDescription>
            Keys automatically generated for this test session
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div v-if="userKey" class="space-y-3">
            <div class="text-sm">
              <Label class="font-medium text-gray-700"
                >Your Spending Key (Mnemonic):</Label
              >
              <div class="mt-1 flex items-center gap-2">
                <code
                  class="flex-1 rounded border bg-white px-3 py-2 font-mono text-xs break-all"
                >
                  {{ userKey.mnemonic }}
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  @click="copyToClipboard(userKey.mnemonic)"
                >
                  <Copy class="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div class="text-sm">
              <Label class="font-medium text-gray-700"
                >Your Sapling Address:</Label
              >
              <div class="mt-1 flex items-center gap-2">
                <code
                  class="flex-1 rounded border bg-white px-3 py-2 font-mono text-xs break-all"
                >
                  {{ userKey.address }}
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  @click="copyToClipboard(userKey.address)"
                >
                  <Copy class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div v-if="aliceAddress" class="space-y-3">
            <div class="text-sm">
              <Label class="font-medium text-gray-700"
                >Alice's Sapling Address:</Label
              >
              <div class="mt-1 flex items-center gap-2">
                <code
                  class="flex-1 rounded border bg-white px-3 py-2 font-mono text-xs break-all"
                >
                  {{ aliceAddress }}
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  @click="copyToClipboard(aliceAddress)"
                >
                  <Copy class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div v-if="!userKey || !aliceAddress" class="text-sm text-gray-500">
            Generating keys...
          </div>
        </CardContent>
      </Card>

      <!-- Shield Tez -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Lock class="size-4" />
            Shield Tez
          </CardTitle>
          <CardDescription>
            Send tez from your public address to your private Sapling address
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label>Amount (ꜩ)</Label>
            <Input
              v-model.number="shieldAmount"
              type="number"
              placeholder="3"
              step="0.1"
              min="0.1"
              :disabled="isRunning || !userKey"
            />
          </div>
          <Button
            @click="handleShieldToUser"
            :disabled="
              !walletConnected || !contractAddress || !userKey || isRunning
            "
            class="w-full"
            data-testid="sapling-shield-button"
          >
            <Lock class="mr-2 h-4 w-4" />
            Shield Tez
          </Button>
        </CardContent>
      </Card>

      <!-- Transfer to Alice -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <ArrowRightLeft class="size-4" />
            Transfer to Alice
          </CardTitle>
          <CardDescription>
            Send tez from your private address to Alice's private address
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label>Amount (ꜩ)</Label>
            <Input
              v-model.number="transferAmount"
              type="number"
              placeholder="1"
              step="0.1"
              min="0.1"
              :disabled="isRunning || !userKey || !aliceAddress"
            />
          </div>
          <Button
            @click="handleTransferToAlice"
            :disabled="
              !walletConnected ||
              !contractAddress ||
              !userKey ||
              !aliceAddress ||
              isRunning
            "
            class="w-full"
            data-testid="sapling-transfer-button"
          >
            <ArrowRightLeft class="mr-2 h-4 w-4" />
            Transfer to Alice
          </Button>
        </CardContent>
      </Card>

      <!-- Unshield to User's tz1 -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Unlock class="size-4" />
            Unshield to Your tz1 Address
          </CardTitle>
          <CardDescription>
            Send tez from your private address back to your public tz1 address
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label>Amount (ꜩ)</Label>
            <Input
              v-model.number="unshieldAmount"
              type="number"
              placeholder="1"
              step="0.1"
              min="0.1"
              :disabled="isRunning || !userKey"
            />
          </div>
          <Button
            @click="handleUnshieldToUser"
            :disabled="
              !walletConnected || !contractAddress || !userKey || isRunning
            "
            class="w-full"
            data-testid="sapling-unshield-button"
          >
            <Unlock class="mr-2 h-4 w-4" />
            Unshield Tez
          </Button>
        </CardContent>
      </Card>

      <!-- Get Transaction History -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <History class="size-4" />
            Transaction History
          </CardTitle>
          <CardDescription>
            View your Sapling transaction history
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <Button
            @click="handleGetTransactionHistory"
            :disabled="
              !walletConnected || !contractAddress || !userKey || isRunning
            "
            class="w-full"
            data-testid="sapling-history-button"
          >
            <History class="mr-2 h-4 w-4" />
            Get Transaction History
          </Button>
          <div v-if="transactionHistory" class="space-y-3">
            <!-- Info Note -->
            <div class="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div class="mb-1 text-sm font-medium text-blue-900">
                Why are there so many transactions?
              </div>
              <div class="text-xs text-blue-800">
                Sapling uses a UTXO model (like Bitcoin). When spending, you
                must consume entire "notes" (like bills) and create change back
                to yourself. A single transfer may show as multiple
                transactions: one spending the full amount and another receiving
                change.
              </div>
            </div>

            <!-- Transaction Count -->
            <div class="rounded-lg border bg-white p-3">
              <div class="mb-1 text-sm font-medium text-gray-700">
                Total Transactions:
              </div>
              <div class="text-2xl font-bold">
                {{ transactionHistory.total }}
              </div>
            </div>

            <!-- Transaction List -->
            <div class="space-y-1.5">
              <div
                v-for="(tx, index) in transactionHistory.transactions"
                :key="`tx-${index}`"
                :class="[
                  'flex items-center justify-between rounded-lg border px-3 py-2 text-sm',
                  tx.type === 'incoming'
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50',
                ]"
              >
                <div class="flex items-center gap-2">
                  <span
                    :class="[
                      'font-medium',
                      tx.type === 'incoming'
                        ? 'text-green-800'
                        : 'text-red-800',
                    ]"
                  >
                    {{ tx.type === "incoming" ? "+" : "-" }}
                    {{ formatBalance(tx.amount) }} ꜩ
                  </span>
                  <span v-if="tx.memo" class="text-xs text-gray-600">
                    ({{ tx.memo }})
                  </span>
                </div>
                <span class="text-xs text-gray-500">
                  {{ tx.type === "incoming" ? "In" : "Out" }}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Get Balance -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Wallet class="size-4" />
            Shielded Pool Balance
          </CardTitle>
          <CardDescription>
            Check your balance in the Sapling shielded pool
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <Button
            @click="handleGetBalance"
            :disabled="
              !walletConnected || !contractAddress || !userKey || isRunning
            "
            class="w-full"
            data-testid="sapling-balance-button"
          >
            <Wallet class="mr-2 h-4 w-4" />
            Get Balance
          </Button>
          <div v-if="userBalance !== null" class="space-y-2">
            <div class="rounded-lg border bg-white p-3">
              <div class="text-sm font-medium text-gray-700">Your Balance:</div>
              <div class="text-2xl font-bold">
                {{ formatBalance(userBalance) }} ꜩ
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { copyToClipboard } from "@/lib/utils";
import {
  generateAliceAddress,
  generateUserSpendingKey,
  getUserSaplingBalance,
  getUserTransactionHistory,
  shieldToUser,
  transferToAlice,
  unshieldToUser,
  type SaplingTransactionHistory,
  type UserSaplingKey,
} from "@/modules/tests/tests/sapling/sapling";
import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import { type ContractConfig } from "@/types/contract";
import {
  ArrowRightLeft,
  Copy,
  History,
  Key,
  Lock,
  TriangleAlert,
  Unlock,
  Wallet,
} from "lucide-vue-next";
import { computed, onMounted, ref, shallowRef } from "vue";
import { toast } from "vue-sonner";

const diagramStore = useDiagramStore();
const walletStore = useWalletStore();

const walletConnected = computed(() => !!walletStore.getAddress);
const isRunning = ref(false);

const contractAddress = ref("");
// Use shallowRef to preserve private class members
const userKey = shallowRef<UserSaplingKey | null>(null);
const aliceAddress = ref("");

// Amounts (in tez)
const shieldAmount = ref(3);
const transferAmount = ref(1);
const unshieldAmount = ref(1);

// Results
const transactionHistory = ref<SaplingTransactionHistory | null>(null);
const userBalance = ref<number | null>(null);

// Get contract address from config
const CONTRACT_ADDRESS =
  (contracts as ContractConfig[]).find(
    (contract: ContractConfig) => contract.contractName === "sapling",
  )?.address ?? "";

onMounted(async () => {
  diagramStore.setTestDiagram("sapling");
  contractAddress.value = CONTRACT_ADDRESS;

  // Automatically generate keys on load
  try {
    const [key, address] = await Promise.all([
      generateUserSpendingKey(),
      generateAliceAddress(),
    ]);

    userKey.value = key;
    aliceAddress.value = address;
  } catch (error) {
    console.error("Key generation error:", error);
    toast.error("Failed to generate Sapling keys");
  }
});

const handleShieldToUser = async () => {
  if (!walletStore.getTezos || !userKey.value) return;

  try {
    isRunning.value = true;
    toast.info("Shielding tez (generating zero-knowledge proof)...", {
      duration: 30000,
    });

    const opHash = await shieldToUser(
      walletStore.getTezos,
      contractAddress.value,
      userKey.value,
      shieldAmount.value,
    );

    diagramStore.setOperationHash(opHash);
  } catch (error) {
    console.error("Shield error:", error);
    diagramStore.setErrorMessage(error);
    toast.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    isRunning.value = false;
  }
};

const handleTransferToAlice = async () => {
  if (!walletStore.getTezos || !userKey.value || !aliceAddress.value) return;

  try {
    isRunning.value = true;
    toast.info("Transferring to Alice (generating zero-knowledge proof)...", {
      duration: 30000,
    });

    const opHash = await transferToAlice(
      walletStore.getTezos,
      contractAddress.value,
      userKey.value,
      aliceAddress.value,
      transferAmount.value,
    );

    diagramStore.setOperationHash(opHash);
    toast.success("Transfer completed");
  } catch (error) {
    console.error("Transfer error:", error);
    diagramStore.setErrorMessage(error);
    toast.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    isRunning.value = false;
  }
};

const handleUnshieldToUser = async () => {
  if (!walletStore.getTezos || !userKey.value || !walletStore.getAddress)
    return;

  try {
    isRunning.value = true;
    toast.info("Unshielding tez (generating zero-knowledge proof)...", {
      duration: 30000,
    });

    const opHash = await unshieldToUser(
      walletStore.getTezos,
      contractAddress.value,
      userKey.value,
      walletStore.getAddress,
      unshieldAmount.value,
    );

    diagramStore.setOperationHash(opHash);
  } catch (error) {
    console.error("Unshield error:", error);
    diagramStore.setErrorMessage(error);
    toast.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    isRunning.value = false;
  }
};

const handleGetTransactionHistory = async () => {
  if (!walletStore.getTezos || !userKey.value) return;

  try {
    isRunning.value = true;
    toast.info("Fetching transaction history...");

    const history = await getUserTransactionHistory(
      walletStore.getTezos,
      contractAddress.value,
      userKey.value,
    );

    transactionHistory.value = history;
    toast.success(`Found ${history.total} transaction(s)`);
  } catch (error) {
    console.error("Transaction history error:", error);
    toast.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    isRunning.value = false;
  }
};

const handleGetBalance = async () => {
  if (!walletStore.getTezos || !userKey.value) return;

  try {
    isRunning.value = true;
    toast.info("Fetching balance...");

    const balance = await getUserSaplingBalance(
      walletStore.getTezos,
      contractAddress.value,
      userKey.value,
    );

    userBalance.value = balance;
    toast.success("Balance retrieved");
  } catch (error) {
    console.error("Balance fetch error:", error);
    toast.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    isRunning.value = false;
  }
};

const formatBalance = (balance: number): string => {
  return (balance / 1000000).toFixed(6);
};
</script>
