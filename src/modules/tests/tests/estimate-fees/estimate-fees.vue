<template>
  <div class="w-full flex justify-center">
    <Button @click="estimate()" :disabled="sending" class="w-32">
      <Loader2 v-if="sending" class="w-4 h-4 mr-2 animate-spin" />
      <p v-else>Estimate Fees</p>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { useDiagramStore } from "@/stores/diagramStore";
import { ref, onMounted } from "vue";
import Button from "@/components/ui/button/Button.vue";
import { Loader2 } from "lucide-vue-next";
import { estimateFees } from "@/modules/tests/tests/estimate-fees/estimate-fees";

const sending = ref<boolean>(false);
const diagramStore = useDiagramStore();

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
