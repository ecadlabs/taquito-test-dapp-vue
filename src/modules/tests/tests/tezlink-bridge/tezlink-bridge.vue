<template>
  <div
    class="mx-auto flex w-full max-w-[600px] flex-col items-center gap-6 px-3 sm:px-6"
  >
    <Card class="w-full">
      <CardContent>
        <!-- Shared Tezlink Wallet Connection Section -->
        <div class="bg-card mb-4 space-y-2 rounded-lg border p-3 sm:p-4">
          <div class="flex items-center justify-between gap-2">
            <div class="flex min-w-0 items-center gap-2">
              <div
                class="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100"
              >
                <span class="text-sm font-bold text-blue-600">
                  <span v-if="tezlinkWalletStore.address">TL</span>
                  <span v-else>
                    <SquareDashed class="text-muted-foreground size-4" />
                  </span>
                </span>
              </div>
              <div class="min-w-0">
                <p class="text-muted-foreground text-xs">Network</p>
                <p
                  v-if="tezlinkWalletStore.address"
                  class="truncate font-semibold"
                >
                  Tezlink
                </p>
                <p v-else class="text-muted-foreground text-sm">
                  Not Connected
                </p>
              </div>
            </div>
            <Button
              v-if="!tezlinkWalletStore.address"
              size="sm"
              variant="outline"
              :disabled="tezlinkWalletStore.isConnecting"
              @click="connectTezlinkWallet"
              class="shrink-0 text-xs sm:text-sm"
            >
              {{
                tezlinkWalletStore.isConnecting ? "Connecting..." : "Connect"
              }}
            </Button>
            <Button
              v-else
              size="sm"
              variant="outline"
              @click="disconnectTezlinkWallet"
              class="shrink-0 text-xs sm:text-sm"
            >
              Disconnect
            </Button>
          </div>

          <div v-if="tezlinkWalletStore.address" class="space-y-2">
            <div
              class="bg-muted flex flex-col gap-2 rounded-md p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div class="flex items-center gap-2">
                <Wallet class="text-muted-foreground size-4" />
                <p class="font-mono text-sm" v-if="tezlinkWalletStore.address">
                  {{ formatAddress(tezlinkWalletStore.address) }}
                </p>
              </div>
              <p class="text-sm font-semibold">{{ tezlinkBalance }} XTZ</p>
            </div>
          </div>
        </div>

        <Tabs v-model="activeTab" class="w-full">
          <TabsList class="grid w-full grid-cols-1">
            <TabsTrigger value="deposit" class="text-xs sm:text-sm"
              >Deposit</TabsTrigger
            >
            <!-- TODO: Implement withdrawal functionality
            <TabsTrigger value="withdraw" class="text-xs sm:text-sm"
              >Withdraw</TabsTrigger
            >
            -->
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
              <Label for="tezlink-address">Tezlink Destination Address</Label>
              <div class="relative">
                <Input
                  id="tezlink-address"
                  v-model="tezlinkAddress"
                  placeholder="0x..."
                  disabled
                  class="font-mono"
                />
              </div>
              <p class="text-muted-foreground text-xs">
                Connect your Tezlink Tezos wallet to auto-fill
              </p>
            </div>

            <Button
              class="w-full"
              :disabled="depositLoading || !walletConnected || !canDeposit"
              @click="performDeposit"
            >
              <ArrowDownToLine class="mt-0.5 size-4" />
              <span v-if="depositLoading">Depositing...</span>
              <span v-else>Deposit to Tezlink</span>
            </Button>
          </TabsContent>

          <!-- TODO: Implement withdrawal functionality
          <TabsContent value="withdraw" class="space-y-4">
            <div v-if="tezlinkWalletStore.address" class="space-y-4">
              <Alert class="border-blue-200 bg-blue-50">
                <Info class="size-4 text-blue-600" />
                <AlertDescription class="text-xs text-blue-900">
                  Withdrawal transaction will be sent on Tezlink.
                </AlertDescription>
              </Alert>

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
                    !tezlinkWalletStore.address
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
                <span v-if="withdrawLoading"> Withdrawing... </span>
                <span v-else> Withdraw to Tezos L1 </span>
              </Button>
            </div>

            <div
              v-else
              class="bg-muted/50 flex flex-col items-center gap-4 rounded-lg border p-8 text-center"
            >
              <Wallet class="text-muted-foreground size-12" />
              <div>
                <p class="font-semibold">Tezlink Wallet Required</p>
                <p class="text-muted-foreground text-sm">
                  Connect your Tezos Tezlink wallet above to withdraw funds from
                  Tezlink.
                </p>
              </div>
            </div>
          </TabsContent>
          -->
        </Tabs>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
// TODO: Re-enable when withdrawal is implemented
// import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDiagramStore } from "@/stores/diagramStore";
import { useTezlinkWalletStore } from "@/stores/tezlinkWalletStore";
import { useWalletStore } from "@/stores/walletStore";
import { validateAddress, ValidationResult } from "@taquito/utils";
import {
  ArrowDownToLine,
  // ArrowUpFromLine,  // TODO: Re-enable when withdrawal is implemented
  // Info,
  SquareDashed,
  Wallet,
} from "lucide-vue-next";
import { computed, onMounted, ref, watch } from "vue";
import { toast } from "vue-sonner";
import { depositToTezlink } from "./tezlink-bridge";

const diagramStore = useDiagramStore();
const walletStore = useWalletStore();
const tezlinkWalletStore = useTezlinkWalletStore();

const activeTab = ref("deposit");
const depositAmount = ref<number>(1);
const tezlinkAddress = ref("");
// TODO: Re-enable when withdrawal is implemented
// const withdrawAmount = ref<number>(1);
// const tezosDestination = ref(walletStore.getAddress || "");

const depositLoading = ref<boolean>(false);
// const withdrawLoading = ref<boolean>(false);

const walletConnected = computed(() => !!walletStore.getAddress);

// Auto-populate Tezlink address and fetch balance when Tezlink wallet connects
watch(
  () => tezlinkWalletStore.address,
  async (newAddress) => {
    if (newAddress) {
      tezlinkAddress.value = newAddress;
      // Fetch Tezlink balance
      try {
        await tezlinkWalletStore.fetchBalance();
      } catch (error) {
        console.error("Failed to fetch Tezlink balance:", error);
      }
    }
  },
  { immediate: true },
);

// TODO: Re-enable when withdrawal is implemented
// Auto-populate Tezos destination address when Tezos wallet connects
// watch(
//   () => walletStore.getAddress,
//   (newAddress) => {
//     if (newAddress) {
//       tezosDestination.value = newAddress;
//     }
//   },
//   { immediate: true },
// );

const connectTezlinkWallet = async () => {
  try {
    const provider = walletStore.getProvider;
    if (provider === "programmatic") {
      const secretKey = await walletStore.getTezos.signer.secretKey();
      await tezlinkWalletStore.initializeWallet("programmatic", secretKey);
    } else if (provider === "beacon" || provider === "walletconnect") {
      await tezlinkWalletStore.initializeWallet(provider);
    } else if (provider === "ledger") {
      await tezlinkWalletStore.initializeWallet("ledger");
    }
  } catch (error) {
    toast.error(`${error}`);
    console.error("Failed to connect Tezlink wallet:", error);
  }
};

const formatAddress = (address: string | null): string => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const tezlinkBalance = computed(() => {
  if (tezlinkWalletStore.getBalance) {
    return (tezlinkWalletStore.getBalance.toNumber() / 1000000).toFixed(4);
  }
  return "0.0000";
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
    validateAddress(tezlinkAddress.value) === ValidationResult.VALID &&
    tezlinkWalletStore.address
  );
});

// TODO: Re-enable when withdrawal is implemented
// const canWithdrawDirect = computed(() => {
//   return (
//     withdrawAmount.value > 0 &&
//     tezosDestination.value.trim().length > 0 &&
//     tezlinkWalletStore.address
//   );
// });

onMounted(() => {
  diagramStore.setTestDiagram("tezlink-bridge", "deposit");
});

const performDeposit = async () => {
  try {
    depositLoading.value = true;
    await depositToTezlink(depositAmount.value, tezlinkAddress.value);

    // Refresh both balances after deposit
    // Note: Tezlink L2 balance may take some time to update after L1 confirmation
    await walletStore.fetchBalance();
    if (tezlinkWalletStore.address) {
      // Wait a bit for the deposit to propagate to L2
      setTimeout(async () => {
        try {
          await tezlinkWalletStore.fetchBalance();
        } catch (error) {
          console.error("Failed to refresh Tezlink balance:", error);
        }
      }, 5000);
    }
  } catch (error) {
    console.error("Failed to deposit:", error);
  } finally {
    depositLoading.value = false;
  }
};

// TODO: Re-enable when withdrawal is implemented
// const performWithdraw = async () => {
//   //
// };

const disconnectTezlinkWallet = async () => {
  await tezlinkWalletStore.disconnectWallet();
};
</script>
