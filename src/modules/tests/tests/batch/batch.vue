<template>
  <div class="flex flex-col items-center gap-4">
    <p class="text-foreground w-1/2 text-center text-sm">
      Batch operation will send a transfer of 1 tez to yourself, and increment
      the counter contract storage by 1.
    </p>
    <Button
      @click="sendBatchOperation()"
      :disabled="sending || !walletStore.getAddress"
    >
      <Group v-if="!sending" class="size-6" />
      <LoaderCircle v-else class="size-5 animate-spin" />
      <p>Send Batch Operation</p>
    </Button>
  </div>
</template>

<script setup lang="ts">
import Button from "@/components/ui/button/Button.vue";
import { sendBatch } from "@/modules/tests/tests/batch/batch";
import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import { Group, LoaderCircle } from "lucide-vue-next";
import { onMounted, ref } from "vue";

const diagramStore = useDiagramStore();
const walletStore = useWalletStore();

onMounted(() => {
  diagramStore.setTestDiagram("batch");
});

const sending = ref(false);
const sendBatchOperation = async () => {
  try {
    sending.value = true;
    await sendBatch();
  } finally {
    sending.value = false;
  }
};
</script>
