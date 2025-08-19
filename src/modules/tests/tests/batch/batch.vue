<template>
  <div class="flex flex-col items-center gap-4">
    <p class="text-sm text-foreground w-1/2 text-center">
      Batch operation will send a transfer of 1 tez to yourself, and increment
      the counter contract storage by 1.
    </p>
    <Button @click="sendBatchOperation()" :disabled="sending">
      <Group v-if="!sending" class="size-6" />
      <LoaderCircle v-else class="size-5 animate-spin" />
      <p>Send Batch Operation</p>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { useDiagramStore } from "@/stores/diagramStore";
import Button from "@/components/ui/button/Button.vue";
import { onMounted, ref } from "vue";
import { Group, LoaderCircle } from "lucide-vue-next";
import { sendBatch } from "@/modules/tests/tests/batch/batch";

const diagramStore = useDiagramStore();

onMounted(() => {
  diagramStore.setTestDiagram("batch");
});

const sending = ref(false);
const sendBatchOperation = async () => {
  sending.value = true;
  await sendBatch();
  sending.value = false;
};
</script>
