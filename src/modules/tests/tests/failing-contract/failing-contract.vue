<template>
  <div class="flex w-full flex-col items-center justify-center gap-6">
    <div class="flex flex-col items-center gap-4 p-4">
      <h4 class="text-md font-medium">Failure Scenarios</h4>

      <div class="grid w-full max-w-2xl grid-cols-1 gap-3 md:grid-cols-2">
        <Button
          @click="() => testFailure('wrong-type')"
          :disabled="!walletConnected || isLoading"
          variant="destructive"
        >
          <Loader2
            v-if="isLoading && currentTest === 'wrong-type'"
            class="mr-2 h-4 w-4 animate-spin"
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
            class="mr-2 h-4 w-4 animate-spin"
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
            class="mr-2 h-4 w-4 animate-spin"
          />
          <XCircle v-else class="mr-2 h-4 w-4" />
          Invalid Structure
        </Button>
      </div>
    </div>

    <!-- Error Visualization Section -->
    <div
      v-if="errorMessage"
      class="w-full max-w-2xl rounded-lg border border-red-200 bg-red-50 p-4"
    >
      <h4 class="text-md mb-2 flex items-center font-medium text-red-800">
        <AlertTriangle class="mr-2 h-4 w-4" />
        Error Details
      </h4>
      <div class="rounded border bg-red-100 p-3 text-sm">
        <pre
          class="overflow-auto font-mono text-xs whitespace-pre-wrap text-red-700"
          >{{ formattedError }}</pre
        >
      </div>
      <p class="mt-2 text-xs text-red-600">
        This error was expected and demonstrates how Taquito handles contract
        call failures.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from "@/components/ui/button/Button.vue";
import { testContractFailure } from "@/modules/tests/tests/failing-contract/failing-contract";
import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import { AlertTriangle, Loader2, XCircle } from "lucide-vue-next";
import { computed, onMounted, ref, watch } from "vue";

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
