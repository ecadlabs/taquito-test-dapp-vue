<template>
  <div class="w-full flex flex-col items-center gap-4">
    <div>
      <Label class="mb-1">Wallet Address</Label>
      <Input placeholder="Wallet address..." v-model="toAddress" class="w-48" />
    </div>

    <div>
      <NumberField :min="1" :max="100" v-model="amount">
        <Label>Amount</Label>
        <NumberFieldContent class="w-48">
          <NumberFieldDecrement />
          <NumberFieldInput />
          <NumberFieldIncrement />
        </NumberFieldContent>
      </NumberField>
    </div>
    <Button
      @click="sendTransfer()"
      :disabled="sending || !walletStore.getAddress"
      class="w-32"
    >
      <Loader2 v-if="sending" class="w-4 h-4 mr-2 animate-spin" />
      <p v-else>Send Transfer</p>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { useDiagramStore } from "@/stores/diagramStore";
import { ref, onMounted, watch } from "vue";
import { send } from "@/modules/tests/tests/transfer/transfer-tez";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
import { Loader2 } from "lucide-vue-next";
import { useWalletStore } from "@/stores/walletStore";

const walletStore = useWalletStore();

const toAddress = ref<string>(walletStore.getAddress ?? "");
const amount = ref<number>(1);
const sending = ref<boolean>(false);
const diagramStore = useDiagramStore();

onMounted(() => {
  diagramStore.setTestDiagram("transfer");
});

watch(
  () => walletStore.getAddress,
  (newAddress: string | undefined) => {
    if (typeof newAddress === "string" && newAddress.length > 0) {
      toAddress.value = newAddress;
    }
  },
);

const sendTransfer = async () => {
  if (!toAddress.value) return;

  try {
    sending.value = true;
    await send(toAddress.value, amount.value);
  } catch (error) {
    console.error(error);
  } finally {
    sending.value = false;
  }
};
</script>
