<template>
  <Button
    v-if="canEstimateFees"
    @click="estimateFees"
    variant="outline"
    size="sm"
  >
    <HandCoins class="size-4" />
    <p>Fees</p>
  </Button>

  <FeeEstimationDialog
    v-if="dialogFeeInfo"
    :fee-info="dialogFeeInfo"
    :open="dialogOpen"
    @update:open="dialogOpen = $event"
  />
</template>

<script setup lang="ts">
import FeeEstimationDialog, {
  type FeeEstimateData,
} from "@/components/estimated-fees-dialog.vue";
import { Button } from "@/components/ui/button";
import { useDiagramStore } from "@/stores/diagramStore";
import { HandCoins } from "lucide-vue-next";
import { computed, ref } from "vue";

const diagramStore = useDiagramStore();
const dialogOpen = ref(false);
const dialogFeeInfo = ref<FeeEstimateData | null>(null);

const canEstimateFees = computed(() => {
  return !!diagramStore.feeEstimate;
});

const estimateFees = () => {
  const estimate = diagramStore.feeEstimate;

  if (!estimate) {
    console.error("No estimate found");
    return;
  }

  dialogFeeInfo.value = {
    burnFeeMutez: estimate.burnFeeMutez,
    gasLimit: estimate.gasLimit,
    minimalFeeMutez: estimate.minimalFeeMutez,
    storageLimit: estimate.storageLimit,
    suggestedFeeMutez: estimate.suggestedFeeMutez,
    totalCost: estimate.totalCost,
    usingBaseFeeMutez: estimate.usingBaseFeeMutez,
  };
  dialogOpen.value = true;
};
</script>
