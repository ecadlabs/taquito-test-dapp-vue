<template>
  <div v-if="signature">
    <Label class="mb-1">Signature</Label>
    <p>{{ signature }}</p>
  </div>

  <div class="w-full flex flex-col items-center gap-2">
    <div>
      <Label class="mb-1">String Payload</Label>
      <Input
        placeholder="Payload..."
        v-model="payload"
        class="w-48"
        data-testid="string-payload-input"
      />
    </div>
    <Button
      @click="signPayload()"
      :disabled="anySigningInProgress || !walletStore.getAddress"
      class="w-32"
      data-testid="sign-payload-button"
    >
      <Loader2 v-if="signing" class="w-4 h-4 mr-2 animate-spin" />
      <p v-else>Sign Payload</p>
    </Button>
    <Button
      @click="signTzip32Payload()"
      :disabled="anySigningInProgress || !walletStore.getAddress"
      class="w-48"
      data-testid="sign-tzip32-payload-button"
    >
      <Loader2 v-if="signingTzip32" class="w-4 h-4 mr-2 animate-spin" />
      <p v-else>Sign Tzip32 Payload</p>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { useDiagramStore } from "@/stores/diagramStore";
import { ref, onMounted, computed } from "vue";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-vue-next";
import { useWalletStore } from "@/stores/walletStore";
import {
  sign,
  signTzip32,
} from "@/modules/tests/tests/sign-payload/sign-payload";

const diagramStore = useDiagramStore();
const walletStore = useWalletStore();

const payload = ref<string>("");
const signature = ref<string | null>(null);
const signing = ref<boolean>(false);
const signingTzip32 = ref<boolean>(false);

const anySigningInProgress = computed(() => {
  return signing.value || signingTzip32.value;
});

onMounted(() => {
  diagramStore.setTestDiagram("sign-payload");
});

const signPayload = async () => {
  try {
    signing.value = true;
    signature.value = await sign(payload.value);
  } catch (error) {
    console.error(error);
  } finally {
    signing.value = false;
  }
};

const signTzip32Payload = async () => {
  try {
    signingTzip32.value = true;
    signature.value = await signTzip32(payload.value);
  } catch (error) {
    console.error(error);
  } finally {
    signingTzip32.value = false;
  }
};
</script>
