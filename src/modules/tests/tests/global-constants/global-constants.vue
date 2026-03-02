<template>
  <div class="space-y-4">
    <div class="space-y-4">
      <!-- Michelson expression input -->
      <div class="space-y-2">
        <Label for="expression-input">Michelson Expression (JSON):</Label>
        <Textarea
          id="expression-input"
          v-model="expressionInput"
          placeholder="Enter Michelson expression in JSON format..."
          class="min-h-32 font-mono text-sm"
        />
      </div>

      <div class="flex flex-col gap-2 sm:flex-row">
        <Button
          @click="registerConstant"
          :disabled="
            !walletConnected || !expressionInput.trim() || isRegistering
          "
        >
          <Loader2 v-if="isRegistering" class="mr-2 h-4 w-4 animate-spin" />
          <Hash v-else class="mr-2 h-4 w-4" />
          {{ isRegistering ? "Registering..." : "Register Constant" }}
        </Button>
        <Button variant="outline" @click="generateRandomExpression">
          <Shuffle class="mr-2 h-4 w-4" />
          Generate Random
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from "@/components/ui/button/Button.vue";
import Label from "@/components/ui/label/Label.vue";
import Textarea from "@/components/ui/textarea/Textarea.vue";
import {
  generateSampleExpression,
  registerGlobalConstant,
} from "@/modules/tests/tests/global-constants/global-constants";
import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import { Hash, Loader2, Shuffle } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";

const diagramStore = useDiagramStore();
const walletStore = useWalletStore();

const walletConnected = computed(() => !!walletStore.getAddress);
const expressionInput = ref("");
const isRegistering = ref(false);

onMounted(() => {
  diagramStore.setTestDiagram("global-constants");
});

const generateRandomExpression = () => {
  const randomExpression = generateSampleExpression();
  expressionInput.value = JSON.stringify(randomExpression, null, 2);
};

const registerConstant = async () => {
  isRegistering.value = true;

  try {
    const expression = JSON.parse(expressionInput.value);
    await registerGlobalConstant(expression);
  } catch (error) {
    console.error("Registration error:", error);
  } finally {
    isRegistering.value = false;
  }
};
</script>
