<template>
  <div class="flex w-full flex-col items-center justify-center gap-4">
    <div>
      <Label class="mb-1">Storage Limit</Label>
      <Input
        placeholder="Storage limit..."
        v-model="storageLimit"
        class="w-48"
        data-testid="contract-signature-input"
      />
    </div>
    <div>
      <Label class="mb-1">Gas Limit</Label>
      <Input
        placeholder="Gas limit..."
        v-model="gasLimit"
        class="w-48"
        data-testid="contract-public-key-input"
      />
    </div>
    <div>
      <Label class="mb-1">Fee (mutez)</Label>
      <Input
        placeholder="Mutez Fee..."
        v-model="fee"
        class="w-48"
        data-testid="contract-public-key-input"
      />
    </div>
    <Button
      @click="interactWithContract()"
      :disabled="!walletConnected || sending"
      class="w-48"
    >
      <Loader2 v-if="sending" class="animate-spin" />
      <p v-else>Interact with Contract</p>
    </Button>
  </div>
</template>

<script setup lang="ts">
import Button from "@/components/ui/button/Button.vue";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { interact } from "@/modules/tests/tests/transaction-limit/transaction-limit";
import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import { Loader2 } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";

const diagramStore = useDiagramStore();
const walletStore = useWalletStore();

const walletConnected = computed(() => !!walletStore.getAddress);

const storageLimit = ref<number>(800);
const gasLimit = ref<number>(8000);
const fee = ref<number>(3000);

const sending = ref<boolean>(false);

onMounted(() => {
  diagramStore.setTestDiagram("transaction-limit");
});

const interactWithContract = async () => {
  sending.value = true;
  await interact(storageLimit.value, gasLimit.value, fee.value);
  sending.value = false;
};
</script>
