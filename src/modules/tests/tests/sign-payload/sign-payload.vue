<template>
  <div class="w-full flex flex-col items-center gap-4">
    <div>
      <Label class="mb-1">String Payload</Label>
      <Input placeholder="Payload..." v-model="payload" class="w-48" />
    </div>
    <Button
      @click="signPayload()"
      :disabled="sending || !walletStore.getAddress"
      class="w-32"
      data-testid="sign-payload-button"
    >
      <Loader2 v-if="sending" class="w-4 h-4 mr-2 animate-spin" />
      <p v-else>Sign Payload</p>
    </Button>
    <div v-if="signature">
      <Label class="mb-1">Signature</Label>
      <p>{{ signature }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDiagramStore } from "@/stores/diagramStore";
import { ref, onMounted } from "vue";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-vue-next";
import { useWalletStore } from "@/stores/walletStore";
import { sign } from "@/modules/tests/tests/sign-payload/sign-payload";

const diagramStore = useDiagramStore();
const walletStore = useWalletStore();

const payload = ref<string>("");
const signature = ref<string | null>(null);
const sending = ref<boolean>(false);

onMounted(() => {
  diagramStore.setTestDiagram("sign-payload");
});

const signPayload = async () => {
  try {
    sending.value = true;
    signature.value = await sign(payload.value);
  } catch (error) {
    console.error(error);
  } finally {
    sending.value = false;
  }
};
</script>
