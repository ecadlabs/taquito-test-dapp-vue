<template>
  <div class="flex w-full justify-center">
    <Button
      @click="estimate()"
      :disabled="sending || !walletStore.getAddress"
      class="w-32"
    >
      <Loader2 v-if="sending" class="mr-2 h-4 w-4 animate-spin" />
      <p v-else>Estimate Fees</p>
    </Button>
  </div>
</template>

<script setup lang="ts">
import Button from "@/components/ui/button/Button.vue";
import { estimateFees } from "@/modules/tests/tests/estimate-fees/estimate-fees";
import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import { Loader2 } from "lucide-vue-next";
import { onMounted, ref } from "vue";

const sending = ref<boolean>(false);
const diagramStore = useDiagramStore();
const walletStore = useWalletStore();

onMounted(() => {
  diagramStore.setTestDiagram("estimate-fees");
});

const estimate = async () => {
  try {
    sending.value = true;
    await estimateFees();
  } catch (error) {
    console.error(error);
  } finally {
    sending.value = false;
  }
};
</script>
