<template>
  <div class="flex w-full flex-col items-center justify-center gap-4">
    <Button @click="fail" :disabled="!walletConnected || sending">
      <Loader2 v-if="sending" class="animate-spin" />
      <p v-else>Fail Noop</p>
    </Button>
  </div>
</template>

<script setup lang="ts">
import Button from "@/components/ui/button/Button.vue";
import { failNoop } from "@/modules/tests/tests/failing-noop/failing-noop";
import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import { Loader2 } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";

const diagramStore = useDiagramStore();
const walletStore = useWalletStore();

const walletConnected = computed(() => !!walletStore.getAddress);

const sending = ref<boolean>(false);

onMounted(() => {
  diagramStore.setTestDiagram("failing-noop");
});

const fail = async () => {
  sending.value = true;
  await failNoop();
  sending.value = false;
};
</script>
