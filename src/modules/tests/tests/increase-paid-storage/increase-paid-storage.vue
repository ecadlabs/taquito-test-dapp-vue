<template>
  <div class="flex w-full flex-col items-center gap-4">
    <div>
      <Label class="mb-1">Contract Address</Label>
      <Input
        placeholder="Contract address..."
        v-model="contractAddress"
        class="w-48"
      />
    </div>

    <div>
      <NumberField :min="1" :max="10" v-model="bytes">
        <Label>Bytes</Label>
        <NumberFieldContent class="w-48">
          <NumberFieldDecrement />
          <NumberFieldInput />
          <NumberFieldIncrement />
        </NumberFieldContent>
      </NumberField>
    </div>
    <Button
      @click="increase()"
      :disabled="processing || !walletStore.getAddress"
      class="w-32"
    >
      <Loader2 v-if="processing" class="mr-2 h-4 w-4 animate-spin" />
      <p v-else>Increase Storage</p>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
import contracts from "@/contracts/contract-config.json";
import { increaseStorage } from "@/modules/tests/tests/increase-paid-storage/increase-paid-storage";
import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import type { ContractConfig } from "@/types/contract";
import { Loader2 } from "lucide-vue-next";
import { onMounted, ref } from "vue";

const contractAddress = ref<string>();
const bytes = ref<number>(1);
const processing = ref<boolean>(false);
const diagramStore = useDiagramStore();
const walletStore = useWalletStore();

onMounted(() => {
  diagramStore.setTestDiagram("transfer");

  const CONTRACT_ADDRESS =
    (contracts as ContractConfig[]).find(
      (contract: ContractConfig) => contract.contractName === "counter",
    )?.address ?? "";

  contractAddress.value = CONTRACT_ADDRESS;
});

const increase = async () => {
  if (!contractAddress.value) return;

  try {
    processing.value = true;
    await increaseStorage(contractAddress.value, bytes.value);
  } catch (error) {
    console.error(error);
  } finally {
    processing.value = false;
  }
};
</script>
