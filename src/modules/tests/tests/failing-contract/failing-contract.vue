<template>
  <div class="flex flex-col items-center w-full justify-center gap-6">
    <div class="flex flex-col items-center gap-4 p-4">
      <h4 class="text-md font-medium">Failure Scenarios</h4>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
        <Button
          @click="() => testFailure('wrong-type')"
          :disabled="!walletConnected || isLoading"
          variant="destructive"
        >
          <Loader2
            v-if="isLoading && currentTest === 'wrong-type'"
            class="animate-spin mr-2 h-4 w-4"
          />
          <XCircle v-else class="mr-2 h-4 w-4" />
          Wrong Type
        </Button>

        <Button
          @click="() => testFailure('invalid-entrypoint')"
          :disabled="!walletConnected || isLoading"
          variant="destructive"
        >
          <Loader2
            v-if="isLoading && currentTest === 'invalid-entrypoint'"
            class="animate-spin mr-2 h-4 w-4"
          />
          <XCircle v-else class="mr-2 h-4 w-4" />
          Invalid Entrypoint
        </Button>

        <Button
          @click="() => testFailure('invalid-parameter-structure')"
          :disabled="!walletConnected || isLoading"
          variant="destructive"
        >
          <Loader2
            v-if="isLoading && currentTest === 'invalid-parameter-structure'"
            class="animate-spin mr-2 h-4 w-4"
          />
          <XCircle v-else class="mr-2 h-4 w-4" />
          Invalid Structure
        </Button>
      </div>
    </div>

    <!-- Error Visualization Section -->
    <div
      v-if="errorMessage"
      class="w-full max-w-2xl p-4 border border-red-200 rounded-lg bg-red-50"
    >
      <h4 class="text-md font-medium text-red-800 mb-2 flex items-center">
        <AlertTriangle class="mr-2 h-4 w-4" />
        Error Details
      </h4>
      <div class="bg-red-100 p-3 rounded border text-sm">
        <pre
          class="whitespace-pre-wrap text-red-700 font-mono text-xs overflow-auto"
          >{{ formattedError }}</pre
        >
      </div>
      <p class="text-xs text-red-600 mt-2">
        This error was expected and demonstrates how Taquito handles contract
        call failures.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDiagramStore } from "@/stores/diagramStore";
import { computed, onMounted, ref, watch } from "vue";
import { useWalletStore } from "@/stores/walletStore";
import { testContractFailure } from "@/modules/tests/tests/failing-contract/failing-contract";
import { Loader2, XCircle, AlertTriangle } from "lucide-vue-next";
import Button from "@/components/ui/button/Button.vue";

const diagramStore = useDiagramStore();
const walletStore = useWalletStore();

const walletConnected = computed(() => !!walletStore.getAddress);
const isLoading = ref<boolean>(false);
const currentTest = ref<string>("");
const errorMessage = ref();

const formattedError = computed(() => {
  if (!errorMessage.value) return "";

  try {
    return typeof errorMessage.value === "string"
      ? errorMessage.value
      : JSON.stringify(errorMessage.value, null, 2);
  } catch {
    return String(errorMessage.value);
  }
});

// Watch for errors from the diagram store
watch(
  () => diagramStore.errorMessage,
  (newError) => {
    if (newError) {
      errorMessage.value = newError;
      isLoading.value = false;
      currentTest.value = "";
    }
  },
);

onMounted(() => {
  diagramStore.setTestDiagram("failing-contract");
});

const testFailure = async (scenario: string) => {
  isLoading.value = true;
  currentTest.value = scenario;
  errorMessage.value = null;
  await testContractFailure(scenario);
};
</script>
