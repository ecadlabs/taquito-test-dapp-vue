<template>
  <div class="w-fit mx-auto flex flex-col items-center gap-6 px-6">
    <Card class="w-full lg:w-1/2 lg:min-w-[500px]">
      <CardContent>
        <Alert
          v-if="!currentDelegate && !loadingDelegateInformation"
          class="mb-2"
        >
          <TriangleAlert class="size-4" />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            You don't have a delegate set, so you can't stake any tokens. Please
            go to the Delegation test and set a delegate that accepts staking.
          </AlertDescription>
        </Alert>
        <Alert
          v-if="
            currentDelegate && !acceptsStaking && !loadingDelegateInformation
          "
          class="mb-2"
        >
          <TriangleAlert class="size-4" />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            You're currently delegating to a baker that doesn't accept staking.
            Please go to the Delegation test and set a baker that accepts
            staking.
          </AlertDescription>
        </Alert>

        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-[#F4F4F6] py-3 pl-5 pr-3 rounded-md"
        >
          <div class="flex items-center gap-2">
            <Wallet class="size-4 text-muted-foreground mt-0.5" />
            <p class="text-muted-foreground text-sm">Staked Balance</p>
          </div>
          <div class="flex items-center gap-2 text-xl font-bold">
            <p
              v-if="typeof stakedBalance === 'number' && !isNaN(stakedBalance)"
            >
              {{ stakedBalance }} ꜩ
            </p>
            <p v-else-if="stakedBalance === undefined">...</p>
            <p v-else>0 ꜩ</p>
            <Button
              variant="ghost"
              size="icon"
              @click="getStakedBalance"
              :disabled="loadingBalance || !walletConnected"
              aria-label="Refresh Staked Balance"
            >
              <RotateCcw class="size-4 mt-1" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <Label class="mt-4 mb-1.5">Amount (XTZ)</Label>
        <Input
          v-model="amount"
          type="number"
          :min="0.00001"
          :max="balance"
          :step="0.00001"
        />
        <div class="flex flex-col gap-2 mt-4">
          <Button
            class="w-full"
            :disabled="
              !currentDelegate ||
              !acceptsStaking ||
              stakingLoading ||
              anyOperationLoading ||
              !walletConnected
            "
            @click="stakeTokens"
            data-testid="stake-button"
          >
            <Beef class="size-4 mt-0.5" />
            <span v-if="stakingLoading">Staking...</span>
            <span v-else>Stake</span>
          </Button>
          <Button
            class="w-full"
            variant="secondary"
            :disabled="
              !currentDelegate ||
              unstakingLoading ||
              anyOperationLoading ||
              !walletConnected
            "
            @click="unstakeTokens"
            data-testid="unstake-button"
          >
            <LockKeyholeOpen class="size-4 mt-0.5" />
            <span v-if="unstakingLoading">Unstaking...</span>
            <span v-else>Unstake</span>
          </Button>
        </div>
        <Separator class="my-4" />
        <Button
          class="w-full"
          :disabled="
            !currentDelegate ||
            finalizingLoading ||
            anyOperationLoading ||
            !walletConnected
          "
          @click="finalizeUnstakeTokens"
          data-testid="finalize-button"
        >
          <LockKeyholeOpen class="size-4 mt-0.5" />
          <span v-if="finalizingLoading">Finalizing...</span>
          <span v-else>Finalize Unstake</span>
        </Button>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { useDiagramStore } from "@/stores/diagramStore";
import { ref, onMounted, computed } from "vue";
import { Button } from "@/components/ui/button";
import {
  finalizeUnstake,
  getDelegateAcceptsStaking,
  getStakingInfo,
  stake,
  unstake,
} from "@/modules/tests/tests/staking/staking";
import { Input } from "@/components/ui/input";
import { useWalletStore } from "@/stores/walletStore";
import { getDelegate } from "@/modules/tests/tests/delegation/delegation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Beef,
  LockKeyholeOpen,
  RotateCcw,
  TriangleAlert,
  Wallet,
} from "lucide-vue-next";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const diagramStore = useDiagramStore();
const walletStore = useWalletStore();

const amount = ref<number>(1);
const stakedBalance = ref<number>();
const balance = computed(() => {
  if (walletStore.getBalance) {
    return walletStore.getBalance.toNumber() / 1000000;
  }

  return 0;
});

const anyOperationLoading = computed(() => {
  return (
    stakingLoading.value || unstakingLoading.value || finalizingLoading.value
  );
});

const loadingDelegateInformation = ref<boolean>(true);
const currentDelegate = ref<string | null>();
const acceptsStaking = ref<boolean>();
const walletConnected = computed(() => !!walletStore.getAddress);

onMounted(async () => {
  diagramStore.setTestDiagram("staking");

  if (!walletStore.getAddress) {
    throw new Error("No current address found");
  }

  try {
    const delegate = await getDelegate(walletStore.getAddress);
    currentDelegate.value = delegate;

    if (currentDelegate.value) {
      acceptsStaking.value = await getDelegateAcceptsStaking(
        currentDelegate.value,
      );
    }
  } catch (error) {
    console.error("Failed to get delegate information:", error);
    // Set fallback values for testing
    currentDelegate.value = null;
    acceptsStaking.value = false;
  }

  loadingDelegateInformation.value = false;
  await getStakedBalance();
});

const stakingLoading = ref<boolean>(false);
const stakeTokens = async () => {
  try {
    stakingLoading.value = true;
    await stake(amount.value);
    await getStakedBalance();
  } catch (error) {
    console.error(error);
  } finally {
    stakingLoading.value = false;
  }
};

const unstakingLoading = ref<boolean>(false);
const unstakeTokens = async () => {
  try {
    unstakingLoading.value = true;
    await unstake(amount.value);
    await getStakedBalance();
  } catch (error) {
    console.error(error);
  } finally {
    unstakingLoading.value = false;
  }
};

const finalizingLoading = ref<boolean>(false);
const finalizeUnstakeTokens = async () => {
  try {
    finalizingLoading.value = true;
    await finalizeUnstake();
    await getStakedBalance();
  } catch (error) {
    console.error(error);
  } finally {
    finalizingLoading.value = false;
  }
};

const loadingBalance = ref<boolean>(false);
const getStakedBalance = async (): Promise<void> => {
  if (!walletStore.getAddress) {
    throw new Error("No address found");
  }

  loadingBalance.value = true;
  try {
    const stakingInfo = await getStakingInfo(walletStore.getAddress);
    stakedBalance.value = stakingInfo.stakedBalance / 1000000;
  } catch (error) {
    console.error("Failed to get staked balance:", error);
    // Set fallback value when RPC fails
    stakedBalance.value = 0;
  } finally {
    loadingBalance.value = false;
  }
};
</script>
