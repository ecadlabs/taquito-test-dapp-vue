<template>
  <div class="flex w-full flex-col items-center gap-2">
    <div>
      <Label class="mb-1">String Payload</Label>
      <Input
        placeholder="Payload..."
        v-model="payload"
        class="w-48"
        data-testid="string-payload-input"
        autocapitalize="none"
        autocomplete="off"
        spellcheck="false"
      />
    </div>
    <div class="flex items-center gap-2">
      <Button
        @click="signStandardPayload()"
        :disabled="anySigningInProgress || !walletStore.getAddress"
        class="w-32"
        data-testid="sign-payload-button"
      >
        <Loader2 v-if="signing" class="mr-2 h-4 w-4 animate-spin" />
        <p v-else>Sign</p>
      </Button>
      <Button
        @click="signTzip32Payload()"
        :disabled="anySigningInProgress || !walletStore.getAddress"
        class="w-48"
        data-testid="sign-tzip32-payload-button"
      >
        <Loader2 v-if="signingTzip32" class="mr-2 h-4 w-4 animate-spin" />
        <p v-else>Sign (Tzip32 Compatible)</p>
      </Button>
    </div>

    <div class="w-1/2">
      <Separator class="my-4" />
    </div>
    <div class="flex w-full flex-col items-center gap-2 md:w-1/3">
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
      <Loader2 v-if="signingMichelson" class="mr-2 h-4 w-4 animate-spin" />
      <p v-else>Sign Michelson Data</p>
    </Button>
    <div v-if="signature" class="w-1/3">
      <Separator class="my-4" />
    </div>
    <div v-if="signature" class="text-center" role="status" aria-live="polite">
      <p class="mb-1 text-sm font-bold">Signature</p>
      <div class="flex items-center gap-2">
        <p class="text-sm text-wrap break-all" data-testid="signature-output">
          {{ signature }}
        </p>
        <Button
          size="icon"
          variant="ghost"
          @click="copySignature()"
          aria-label="Copy Signature"
        >
          <Copy class="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
    <div class="w-1/2">
      <Separator class="my-4" />
    </div>
    <div>
      <Label class="mb-1">String Payload</Label>
      <Input
        placeholder="Payload..."
        v-model="payloadToSendToContract"
        class="w-48"
        data-testid="contract-payload-input"
        autocapitalize="none"
        autocomplete="off"
        spellcheck="false"
      />
    </div>
    <div>
      <Label class="mb-1">Signature</Label>
      <Input
        placeholder="Signature..."
        v-model="signatureToSendToContract"
        class="w-48"
        data-testid="contract-signature-input"
        autocapitalize="none"
        autocomplete="off"
        spellcheck="false"
      />
    </div>
    <div>
      <Label class="mb-1">Public Key</Label>
      <Input
        placeholder="Public Key..."
        v-model="publicKeyToSendToContract"
        class="w-48"
        data-testid="contract-public-key-input"
        autocapitalize="none"
        autocomplete="off"
        spellcheck="false"
      />
    </div>
    <Button
      @click="verifyPayloadOnContract()"
      :disabled="
        anySigningInProgress ||
        !walletStore.getAddress ||
        !payloadToSendToContract ||
        !signatureToSendToContract ||
        !publicKeyToSendToContract
      "
      class="w-52"
      data-testid="verify-payload-button"
      :aria-busy="verifyingOnContract"
    >
      <Loader2 v-if="verifyingOnContract" class="mr-2 h-4 w-4 animate-spin" />
      <p v-else>Verify Signature</p>
    </Button>
    <Button
      @click="verifyPayloadOnContract(true)"
      :disabled="
        anySigningInProgress ||
        !walletStore.getAddress ||
        !payloadToSendToContract ||
        !signatureToSendToContract ||
        !publicKeyToSendToContract
      "
      class="w-72"
      data-testid="verify-payload-tzip32-button"
      :aria-busy="verifyingOnContract"
    >
      <Loader2 v-if="verifyingOnContract" class="mr-2 h-4 w-4 animate-spin" />
      <p v-else>Verify Signature (Tzip32 Compatible)</p>
    </Button>
    <div v-if="payloadVerifiedOnContract !== undefined">
      <div
        v-if="payloadVerifiedOnContract"
        class="flex items-center gap-2 text-green-500"
        role="status"
        aria-live="polite"
      >
        <Check class="size-4" />
        <p>Signature verified</p>
      </div>
      <div
        v-else
        class="flex items-center gap-2 text-red-500"
        role="status"
        aria-live="polite"
      >
        <X class="size-4" />
        <p>Invalid signature</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import { Check, Copy, Loader2, X } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import { toast } from "vue-sonner";
// Dynamic imports for signing functions to reduce initial bundle size
const loadSigningFunctions = async () => {
  return await import("@/modules/tests/tests/sign-payload/sign-payload");
};

const diagramStore = useDiagramStore();
const walletStore = useWalletStore();

const payload = ref<string>("");
const signature = ref<string | null>(null);
const signing = ref<boolean>(false);
const signingTzip32 = ref<boolean>(false);
const signingMichelson = ref<boolean>(false);
const verifyingOnContract = ref<boolean>(false);

const signatureToSendToContract = ref<string>();
const publicKeyToSendToContract = ref<string>();
const payloadToSendToContract = ref<string>();

const michelsonData = ref<string>(
  `(Pair (Pair { Elt 1 (Pair (Pair "tz1gjaF81ZRRvdzjobyfVNsAeSC6PScjfQwN" "tz1KqTpEZ7Yob7QbPE4Hy4Wo8fHG8LhKxZSx") 0x0501000000026869) } 10000000) (Pair 2 333))`,
);
const michelsonType = ref<string>(
  `(pair (pair (map int (pair (pair address address) bytes)) int) (pair int int))`,
);

const anySigningInProgress = computed(() => {
  return (
    signing.value ||
    signingTzip32.value ||
    signingMichelson.value ||
    verifyingOnContract.value
  );
});

onMounted(async () => {
  diagramStore.setTestDiagram("sign-payload");
  publicKeyToSendToContract.value = await walletStore.getWalletPublicKey();
});

const signStandardPayload = async () => {
  try {
    signing.value = true;
    const { sign } = await loadSigningFunctions();
    signature.value = await sign(payload.value);
    if (signature.value) {
      signatureToSendToContract.value = signature.value;
    }
    payloadToSendToContract.value = payload.value;
  } catch (error) {
    console.error(error);
  } finally {
    signing.value = false;
  }
};

const signTzip32Payload = async () => {
  try {
    signingTzip32.value = true;
    const { signTzip32 } = await loadSigningFunctions();
    signature.value = await signTzip32(payload.value);
    if (signature.value) {
      signatureToSendToContract.value = signature.value;
    }
    payloadToSendToContract.value = payload.value;
  } catch (error) {
    console.error(error);
  } finally {
    signingTzip32.value = false;
  }
};

const signMichelson = async () => {
  try {
    signingMichelson.value = true;
    const { signMichelsonData } = await loadSigningFunctions();
    signature.value = await signMichelsonData(
      michelsonData.value,
      michelsonType.value,
    );
  } catch (error) {
    console.error(error);
  } finally {
    signingMichelson.value = false;
  }
};

const copySignature = async () => {
  if (signature.value) {
    try {
      await navigator.clipboard.writeText(signature.value);
      toast.success("Signature copied to clipboard");
    } catch (error) {
      console.error(error);
      toast.error("Failed to copy signature to clipboard");
    }
  }
};

const payloadVerifiedOnContract = ref<boolean>();
const verifyPayloadOnContract = async (tzip32: boolean = false) => {
  try {
    verifyingOnContract.value = true;

    if (
      !payloadToSendToContract.value ||
      !signatureToSendToContract.value ||
      !publicKeyToSendToContract.value
    ) {
      return;
    }

    const { verifyPayloadViaContract } = await loadSigningFunctions();
    const verified = await verifyPayloadViaContract(
      payloadToSendToContract.value,
      signatureToSendToContract.value,
      publicKeyToSendToContract.value,
      tzip32,
    );

    payloadVerifiedOnContract.value = verified;
  } finally {
    verifyingOnContract.value = false;
  }
};
</script>
