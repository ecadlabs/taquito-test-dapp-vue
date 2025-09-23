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

      <!-- Registration result -->
      <div v-if="registrationResult" class="space-y-2">
        <div class="bg-muted rounded-md p-4" role="status" aria-live="polite">
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <Check class="h-4 w-4 text-green-500" />
              <span class="font-medium">Constant Registered Successfully!</span>
            </div>
            <div class="flex items-center text-sm">
              <span class="font-medium">Hash:</span>
              <code
                class="bg-background ml-2 inline-block max-w-full overflow-hidden rounded p-1 text-xs text-ellipsis whitespace-nowrap"
                :title="registrationResult.hash"
              >
                {{ registrationResult.hash }}
              </code>
              <Button
                variant="ghost"
                size="icon"
                :aria-label="`Copy constant hash`"
                @click="
                  copyToClipboard(
                    registrationResult.hash,
                    'Hash copied to clipboard',
                  )
                "
              >
                <CopyIcon class="size-3" />
              </Button>
            </div>
            <div class="flex items-center text-sm">
              <span class="font-medium">Operation Hash:</span>
              <code class="bg-background ml-2 rounded p-1 text-xs">{{
                registrationResult.operationHash
              }}</code>
              <Button
                variant="ghost"
                size="icon"
                :aria-label="`Copy operation hash`"
                @click="
                  copyToClipboard(
                    registrationResult.operationHash,
                    'Operation hash copied to clipboard',
                  )
                "
              >
                <CopyIcon class="size-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from "@/components/ui/button/Button.vue";
import Label from "@/components/ui/label/Label.vue";
import Textarea from "@/components/ui/textarea/Textarea.vue";
import { copyToClipboard } from "@/lib/utils";
import {
  generateSampleExpression,
  registerGlobalConstant,
} from "@/modules/tests/tests/global-constants/global-constants";
import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import { Check, CopyIcon, Hash, Loader2, Shuffle } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";

const diagramStore = useDiagramStore();
const walletStore = useWalletStore();

const walletConnected = computed(() => !!walletStore.getAddress);
const expressionInput = ref("");
const isRegistering = ref(false);
const registrationResult = ref<{ hash: string; operationHash: string } | null>(
  null,
);

onMounted(() => {
  diagramStore.setTestDiagram("global-constants");
});

const generateRandomExpression = () => {
  const randomExpression = generateSampleExpression();
  expressionInput.value = JSON.stringify(randomExpression, null, 2);
};

const registerConstant = async () => {
  isRegistering.value = true;
  registrationResult.value = null;

  try {
    const expression = JSON.parse(expressionInput.value);

    const expressionHash = await registerGlobalConstant(expression);

    if (expressionHash) {
      const operationHash = diagramStore.operationHash;

      registrationResult.value = {
        hash: expressionHash,
        operationHash:
          (typeof operationHash === "string"
            ? operationHash
            : operationHash?.toString()) ?? "N/A",
      };
    }
  } catch (error) {
    console.error("Registration error:", error);
  } finally {
    isRegistering.value = false;
  }
};
</script>
