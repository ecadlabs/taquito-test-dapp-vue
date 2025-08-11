<template>
  <div class="w-full flex flex-col items-center gap-6 px-6">
    <Input v-model="amount" type="number" />
    <Button @click="stakeTokens">Stake</Button>
    <Button @click="unstakeTokens">Unstake</Button>
    <Button @click="finalizeUnstakeTokens">Finalize Unstake</Button>
  </div>
</template>

<script setup lang="ts">
import { useDiagramStore } from "@/stores/diagramStore";
import { ref, onMounted } from "vue";
import { Button } from "@/components/ui/button";
import {
  finalizeUnstake,
  stake,
  unstake,
} from "@/modules/tests/tests/staking/staking";
import { Input } from "@/components/ui/input";

const diagramStore = useDiagramStore();

const loading = ref<boolean>(false);
const amount = ref<number>(0);

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
</script>
