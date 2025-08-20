<template>
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
      @click="signStandardPayload()"
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
    <div class="w-1/2">
      <Separator class="my-4" />
    </div>
    <div class="w-full md:w-1/3 flex flex-col items-center gap-2">
      <Label class="mb-1">Michelson Data</Label>
      <Textarea placeholder="Data..." v-model="michelsonData" disabled />
      <Label class="mb-1">Michelson Type</Label>
      <Textarea placeholder="Type..." v-model="michelsonType" disabled />
    </div>
    <Button
      @click="signMichelson()"
      :disabled="anySigningInProgress || !walletStore.getAddress"
      class="w-48"
      data-testid="sign-michelson-data-button"
    >
      <Loader2 v-if="signingMichelson" class="w-4 h-4 mr-2 animate-spin" />
      <p v-else>Sign Michelson Data</p>
    </Button>
    <div v-if="signature" class="w-1/3">
      <Separator class="my-4" />
    </div>
    <div v-if="signature" class="text-center">
      <p class="mb-1 text-sm font-bold">Signature</p>
      <div class="flex items-center gap-2">
        <p class="text-sm text-wrap break-all">{{ signature }}</p>
        <Button size="icon" variant="ghost" @click="copySignature()">
          <Copy class="w-4 h-4" />
          <p class="sr-only">Copy Signature</p>
        </Button>
      </div>
    </div>
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
  signMichelsonData,
} from "@/modules/tests/tests/sign-payload/sign-payload";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Copy } from "lucide-vue-next";
import { toast } from "vue-sonner";

const diagramStore = useDiagramStore();
const walletStore = useWalletStore();

const payload = ref<string>("");
const signature = ref<string | null>(null);
const signing = ref<boolean>(false);
const signingTzip32 = ref<boolean>(false);
const signingMichelson = ref<boolean>(false);

const michelsonData = `(Pair (Pair { Elt 1 (Pair (Pair "tz1gjaF81ZRRvdzjobyfVNsAeSC6PScjfQwN" "tz1KqTpEZ7Yob7QbPE4Hy4Wo8fHG8LhKxZSx") 0x0501000000026869) } 10000000) (Pair 2 333))`;
const michelsonType = `(pair (pair (map int (pair (pair address address) bytes)) int) (pair int int))`;

const anySigningInProgress = computed(() => {
  return signing.value || signingTzip32.value || signingMichelson.value;
});

onMounted(() => {
  diagramStore.setTestDiagram("sign-payload");
});

const signStandardPayload = async () => {
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

const signMichelson = async () => {
  try {
    signingMichelson.value = true;
    signature.value = await signMichelsonData(michelsonData, michelsonType);
  } catch (error) {
    console.error(error);
  } finally {
    signingMichelson.value = false;
  }
};

const copySignature = () => {
  if (signature.value) {
    navigator.clipboard.writeText(signature.value);
    toast.success("Signature copied to clipboard");
  }
};
</script>
