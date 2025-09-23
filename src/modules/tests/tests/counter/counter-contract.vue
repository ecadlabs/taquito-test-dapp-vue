<template>
  <div class="flex w-full items-center justify-center gap-4">
    <Button
      @click="decrementCounter()"
      :disabled="!walletConnected"
      aria-label="Decrement"
    >
      <Minus class="size-6" aria-hidden="true" />
    </Button>
    <div class="flex flex-col items-center gap-2">
      <Button
        variant="ghost"
        @click="getStorageValue()"
        :disabled="!walletConnected"
        aria-label="Get Storage Value"
      >
        <RefreshCw class="size-4" aria-hidden="true" />
      </Button>
      <p class="text-5xl font-bold">{{ storageValue ?? "..." }}</p>
      <p class="text-muted-foreground text-sm">Storage Value</p>
      <Button
        variant="ghost"
        @click="resetCounter()"
        :disabled="!walletConnected"
        aria-label="Reset"
      >
        <Trash class="size-4" aria-hidden="true" />
      </Button>
    </div>
    <Button
      @click="incrementCounter()"
      :disabled="!walletConnected"
      aria-label="Increment"
    >
      <Plus class="size-6" aria-hidden="true" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import Button from "@/components/ui/button/Button.vue";
import {
  decrement,
  getContractStorage,
  increment,
  reset,
} from "@/modules/tests/tests/counter/counter-contract";
import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import { Minus, Plus, RefreshCw, Trash } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";

const diagramStore = useDiagramStore();
const walletStore = useWalletStore();

const walletConnected = computed(() => !!walletStore.getAddress);

const storageValue = ref<number>();

onMounted(() => {
  diagramStore.setTestDiagram("counter-contract");
});

const getStorageValue = async () => {
  storageValue.value = await getContractStorage();
};

const incrementCounter = async () => {
  storageValue.value = await increment(1);
};

const decrementCounter = async () => {
  storageValue.value = await decrement(1);
};

const resetCounter = async () => {
  try {
    await reset();
    storageValue.value = 0;
  } catch (error) {
    console.error(error);
  }
};
</script>
