<template>
  <div class="w-fit mx-auto flex flex-col items-center gap-6 px-6">
    <Input v-model="amount" type="number" :min="1" :max="balance" />
    <Button @click="stakeTokens">Stake</Button>
    <Button @click="unstakeTokens">Unstake</Button>
    <Button @click="finalizeUnstakeTokens">Finalize Unstake</Button>

    <Button @click="getStakedBalance">Get Staked Balance</Button>
    <p>Staked Balance: {{ stakedBalance ?? "..." }}</p>
  </div>
</template>

<script setup lang="ts">
import { useDiagramStore } from "@/stores/diagramStore";
import { ref, onMounted, computed } from "vue";
import { Button } from "@/components/ui/button";
import {
  finalizeUnstake,
  getStakingInfo,
  stake,
  unstake,
} from "@/modules/tests/tests/staking/staking";
import { Input } from "@/components/ui/input";
import { useWalletStore } from "@/stores/walletStore";

const diagramStore = useDiagramStore();
const walletStore = useWalletStore();

const loading = ref<boolean>(false);
const amount = ref<number>(1);
const stakedBalance = ref<number>();
const balance = computed(() => {
  if (walletStore.getBalance) {
    return walletStore.getBalance.toNumber() / 1000000;
  }

  return 0;
});

onMounted(async () => {
  diagramStore.setTestDiagram("staking");
});

const stakeTokens = async () => {
  try {
    loading.value = true;
    await stake(amount.value);
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const unstakeTokens = async () => {
  try {
    loading.value = true;
    await unstake(amount.value);
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const finalizeUnstakeTokens = async () => {
  try {
    loading.value = true;
    await finalizeUnstake();
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const getStakedBalance = async (): Promise<void> => {
  if (!walletStore.getAddress) {
    throw new Error("No address found");
  }

  const stakingInfo = await getStakingInfo(walletStore.getAddress);
  stakedBalance.value = stakingInfo.stakedBalance;
};
</script>
