<template>
  <div
    class="mx-auto flex w-full max-w-[600px] flex-col items-center gap-6 px-3 sm:px-6"
  >
    <Card class="w-full">
      <CardContent>
        <!-- Shared EVM Wallet Connection Section -->
        <div class="bg-card mb-4 space-y-2 rounded-lg border p-3 sm:p-4">
          <div class="flex items-center justify-between gap-2">
            <div class="flex min-w-0 items-center gap-2">
              <div
                class="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100"
              >
                <span class="text-sm font-bold text-blue-600">
                  <span v-if="isEtherlinkNetwork">E</span>
                  <span v-else>
                    <SquareDashed class="text-muted-foreground size-4" />
                  </span>
                </span>
              </div>
              <div class="min-w-0">
                <p class="text-muted-foreground text-xs">Network</p>
                <p v-if="evmWallet.isConnected" class="truncate font-semibold">
                  {{ networkName }}
                </p>
                <p v-else class="text-muted-foreground text-sm">
                  Not Connected
                </p>
              </div>
            </div>
            <Button
              v-if="!evmWallet.isConnected"
              size="sm"
              variant="outline"
              :disabled="evmWallet.isConnecting"
              @click="connectEvmWallet"
              class="shrink-0 text-xs sm:text-sm"
            >
              {{ evmWallet.isConnecting ? "Connecting..." : "Connect" }}
            </Button>
            <Button
              v-else
              size="sm"
              variant="outline"
              @click="disconnectEvmWallet"
              class="shrink-0 text-xs sm:text-sm"
            >
              Disconnect
            </Button>
          </div>

          <div v-if="evmWallet.isConnected" class="space-y-2">
            <div
              class="bg-muted flex flex-col gap-2 rounded-md p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div class="flex items-center gap-2">
                <Wallet class="text-muted-foreground size-4" />
                <p class="font-mono text-sm">
                  {{ formatAddress(evmWallet.address) }}
                </p>
              </div>
              <p class="text-sm font-semibold">{{ evmBalance }} XTZ</p>
            </div>

            <!-- Network warning if not on Etherlink -->
            <Alert
              v-if="!isEtherlinkNetwork"
              variant="destructive"
              class="py-2"
            >
              <AlertDescription class="flex items-center justify-between">
                <span class="text-xs"
                  >Wrong network detected. Please switch to Etherlink Ghostnet
                  and reconnect.</span
                >
              </AlertDescription>
            </Alert>
          </div>
        </div>

        <Tabs v-model="activeTab" class="w-full">
          <TabsList class="grid w-full grid-cols-2">
            <TabsTrigger value="deposit" class="text-xs sm:text-sm"
              >Deposit</TabsTrigger
            >
            <TabsTrigger value="withdraw" class="text-xs sm:text-sm"
              >Withdraw</TabsTrigger
            >
          </TabsList>

          <!-- Deposit Tab -->
          <TabsContent value="deposit" class="space-y-4">
            <!-- Tezos L1 (Source) Section -->
            <div
              class="flex flex-col gap-2 rounded-md bg-[#F4F4F6] p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div class="flex items-center gap-2">
                <Wallet class="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <p class="text-muted-foreground text-sm">Tezos L1 Balance</p>
              </div>
              <div class="flex items-center gap-2 text-lg font-bold sm:text-xl">
                <p v-if="balance">{{ balance }} ꜩ</p>
                <p v-else>0 ꜩ</p>
              </div>
            </div>

            <div class="space-y-2">
              <Label for="deposit-amount">Amount (XTZ)</Label>
              <Input
                id="deposit-amount"
                v-model="depositAmount"
                type="number"
                :min="0.1"
                :max="balance || 0"
                :step="0.1"
                :disabled="depositLoading || !walletConnected"
              />
            </div>

            <div class="space-y-2">
              <Label for="etherlink-address"
                >Etherlink Destination Address</Label
              >
              <div class="relative">
                <Input
                  id="etherlink-address"
                  v-model="etherlinkAddress"
                  placeholder="0x..."
                  disabled
                  class="font-mono"
                />
              </div>
              <p class="text-muted-foreground text-xs">
                Connect your EVM wallet to auto-fill
              </p>
            </div>

            <Button
              class="w-full"
              :disabled="depositLoading || !walletConnected || !canDeposit"
              @click="performDeposit"
            >
              <ArrowDownToLine class="mt-0.5 size-4" />
              <span v-if="depositLoading">Depositing...</span>
              <span v-else>Deposit to Etherlink</span>
            </Button>
          </TabsContent>

          <!-- Withdraw Tab -->
          <TabsContent value="withdraw" class="space-y-4">
            <!-- Withdrawal Form (only if EVM wallet connected) -->
            <div v-if="evmWallet.isConnected" class="space-y-4">
              <Alert
                :class="
                  useFastWithdrawal
                    ? 'border-green-200 bg-green-50'
                    : 'border-blue-200 bg-blue-50'
                "
              >
                <Info
                  :class="
                    useFastWithdrawal ? 'text-green-600' : 'text-blue-600'
                  "
                  class="size-4"
                />
                <AlertDescription
                  :class="
                    useFastWithdrawal ? 'text-green-900' : 'text-blue-900'
                  "
                  class="text-xs"
                >
                  <template v-if="useFastWithdrawal">
                    Fast withdrawal enabled. Funds will be available on Tezos L1
                    in 1-2 minutes. A small fee (≈0.10%) applies.
                  </template>
                  <template v-else>
                    Withdrawal transaction will be sent on Etherlink. After the
                    15-day refutation period, funds will be available on Tezos
                    L1.
                  </template>
                </AlertDescription>
              </Alert>

              <!-- Fast Withdrawal Toggle -->
              <div
                class="bg-card flex items-center justify-between rounded-lg border p-4"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="flex size-10 items-center justify-center rounded-full bg-green-100"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="size-5 text-green-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <p class="font-semibold">Fast Withdrawal</p>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="text-muted-foreground size-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                      </svg>
                    </div>
                    <p class="text-muted-foreground text-xs">
                      Transfer time:
                      {{ useFastWithdrawal ? "1-2 Mins" : "15 Days" }}
                    </p>
                  </div>
                </div>
                <Switch
                  v-model="useFastWithdrawal"
                  :disabled="withdrawLoading || !walletConnected"
                />
              </div>

              <div class="space-y-2">
                <Label for="withdraw-amount">Amount (XTZ)</Label>
                <Input
                  id="withdraw-amount"
                  v-model="withdrawAmount"
                  type="number"
                  :min="0.00001"
                  :step="0.00001"
                  :disabled="
                    withdrawLoading ||
                    !walletConnected ||
                    !evmWallet.isConnected
                  "
                />
              </div>

              <div class="space-y-2">
                <Label for="tezos-destination"
                  >Tezos L1 Destination Address</Label
                >
                <div class="relative">
                  <Input
                    id="tezos-destination"
                    v-model="tezosDestination"
                    placeholder="tz1..."
                    :disabled="withdrawLoading || !walletConnected"
                    class="font-mono"
                  />
                </div>
                <p class="text-muted-foreground text-xs">
                  Your Tezos wallet address where funds will be sent
                </p>
              </div>

              <Button
                class="w-full"
                variant="secondary"
                :disabled="
                  withdrawLoading || !walletConnected || !canWithdrawDirect
                "
                @click="performWithdraw"
              >
                <ArrowUpFromLine class="mt-0.5 size-4" />
                <span v-if="withdrawLoading">
                  {{
                    useFastWithdrawal
                      ? "Processing Fast Withdrawal..."
                      : "Withdrawing..."
                  }}
                </span>
                <span v-else>
                  {{
                    useFastWithdrawal
                      ? "Fast Withdraw to Tezos L1"
                      : "Withdraw to Tezos L1"
                  }}
                </span>
              </Button>
            </div>

            <!-- Message when EVM wallet is not connected -->
            <div
              v-else
              class="bg-muted/50 flex flex-col items-center gap-4 rounded-lg border p-8 text-center"
            >
              <Wallet class="text-muted-foreground size-12" />
              <div>
                <p class="font-semibold">EVM Wallet Required</p>
                <p class="text-muted-foreground text-sm">
                  Connect your EVM wallet above to withdraw funds from Etherlink
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  depositToEtherlink,
  isValidEtherlinkAddress,
  withdrawFromEtherlink,
} from "@/modules/tests/tests/etherlink-bridge/etherlink-bridge";
import { useDiagramStore } from "@/stores/diagramStore";
import { useEthereumWalletStore } from "@/stores/ethereumWalletStore";
import { useWalletStore } from "@/stores/walletStore";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Info,
  SquareDashed,
  Wallet,
} from "lucide-vue-next";
import { computed, onMounted, ref, watch } from "vue";
import { toast } from "vue-sonner";

const diagramStore = useDiagramStore();
const walletStore = useWalletStore();
const evmWallet = useEthereumWalletStore();

const activeTab = ref("deposit");
const depositAmount = ref<number>(1);
const etherlinkAddress = ref("");
const withdrawAmount = ref<number>(1);
const tezosDestination = ref(walletStore.getAddress || "");
const useFastWithdrawal = ref<boolean>(true);

const depositLoading = ref<boolean>(false);
const withdrawLoading = ref<boolean>(false);

const walletConnected = computed(() => !!walletStore.getAddress);

// Auto-populate Etherlink address when EVM wallet connects
watch(
  () => evmWallet.address,
  (newAddress) => {
    if (newAddress) {
      etherlinkAddress.value = newAddress;
    }
  },
  { immediate: true },
);

// Auto-populate Tezos destination address when Tezos wallet connects
watch(
  () => walletStore.getAddress,
  (newAddress) => {
    if (newAddress) {
      tezosDestination.value = newAddress;
    }
  },
  { immediate: true },
);

const connectEvmWallet = async () => {
  try {
    await evmWallet.connectWallet();
  } catch (error) {
    toast.error(`${error}`);
    console.error("Failed to connect EVM wallet:", error);
  }
};

const formatAddress = (address: string | null): string => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const evmBalance = computed(() => {
  if (evmWallet.balance) {
    return parseFloat(evmWallet.balance).toFixed(4);
  }
  return "0.0000";
});

const isEtherlinkNetwork = computed(() => {
  if (!evmWallet.chainId) return false;
  // Etherlink Ghostnet: 128123 (0x1f4fb)
  return evmWallet.chainId === "128123" || evmWallet.chainId === "42793";
});

const networkName = computed(() => {
  if (!evmWallet.chainId) return "Unknown Network";

  const networkMap: Record<string, string> = {
    "128123": "Etherlink Ghostnet",
    "42793": "Etherlink",
    "1": "Ethereum Mainnet",
    "5": "Goerli",
    "11155111": "Sepolia",
  };

  return networkMap[evmWallet.chainId] || `Chain ${evmWallet.chainId}`;
});

const balance = computed(() => {
  if (walletStore.getBalance) {
    return walletStore.getBalance.toNumber() / 1000000;
  }
  return 0;
});

const canDeposit = computed(() => {
  return (
    depositAmount.value > 0 &&
    depositAmount.value <= balance.value &&
    isValidEtherlinkAddress(etherlinkAddress.value) &&
    evmWallet.isConnected
  );
});

const canWithdrawDirect = computed(() => {
  return (
    withdrawAmount.value > 0 &&
    tezosDestination.value.trim().length > 0 &&
    evmWallet.isConnected &&
    isEtherlinkNetwork.value
  );
});

onMounted(() => {
  diagramStore.setTestDiagram("etherlink-bridge", "deposit");
});

watch(useFastWithdrawal, (newUseFastWithdrawal) => {
  console.log("newUseFastWithdrawal", newUseFastWithdrawal);
  if (newUseFastWithdrawal) {
    diagramStore.setTestDiagram("etherlink-bridge", "withdraw-fast");
  } else {
    diagramStore.setTestDiagram("etherlink-bridge", "withdraw");
  }
});

watch(activeTab, (newTab) => {
  console.log("newTab", newTab);
  if (newTab === "withdraw") {
    if (useFastWithdrawal.value) {
      diagramStore.setTestDiagram("etherlink-bridge", "withdraw-fast");
    } else {
      diagramStore.setTestDiagram("etherlink-bridge", "withdraw");
    }
  } else {
    diagramStore.setTestDiagram("etherlink-bridge", "deposit");
  }
});

const performDeposit = async () => {
  try {
    depositLoading.value = true;
    await depositToEtherlink(depositAmount.value, etherlinkAddress.value);
  } catch (error) {
    console.error("Failed to deposit:", error);
  } finally {
    depositLoading.value = false;
  }
};

const performWithdraw = async () => {
  try {
    withdrawLoading.value = true;
    await withdrawFromEtherlink(
      withdrawAmount.value,
      tezosDestination.value,
      window.ethereum,
      useFastWithdrawal.value,
    );
  } catch (error) {
    console.error("Failed to withdraw:", error);
  } finally {
    withdrawLoading.value = false;
  }
};

const disconnectEvmWallet = async () => {
  await evmWallet.disconnectWallet();
};
</script>
