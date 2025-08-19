<template>
  <div class="flex flex-col items-center gap-4">
    <p class="text-sm text-foreground w-1/2 text-center">
      Batch operation will send a transfer of 1 tez to yourself, and increment
      the counter contract storage by 1.
    </p>
    <Button @click="sendBatchOperation()">
      <Group class="size-6" />
      <p>Send Batch Operation</p>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { useDiagramStore } from "@/stores/diagramStore";
import Button from "@/components/ui/button/Button.vue";
import { onMounted } from "vue";
import { Group } from "lucide-vue-next";
import { sendBatch } from "@/modules/tests/tests/batch/batch";

const diagramStore = useDiagramStore();

onMounted(() => {
  diagramStore.setTestDiagram("batch");
});

const sendBatchOperation = async () => {
  await sendBatch();
};
</script>
