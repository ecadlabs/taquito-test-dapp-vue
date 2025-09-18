<template>
  <div class="w-full flex flex-col items-center gap-6 px-6">
    <!-- Current delegate section -->
    <div v-if="currentDelegate" class="w-full max-w-md space-y-2">
      <!-- Display current delegate -->
      <div class="mb-4">
        <div class="flex items-center gap-3 mb-2">
          <CheckCircle class="w-6 h-6 text-green-500" />
          <h3 class="text-lg font-semibold">Current Delegate</h3>
        </div>
        <p
          class="text-xs font-mono bg-muted rounded-md py-1 px-2 w-fit text-red-400"
          role="status"
          aria-live="polite"
        >
          {{ currentDelegate }}
        </p>
      </div>

      <!-- Change delegate section -->
      <div>
        <div class="flex items-center gap-1.5 mb-4">
          <Cookie class="w-6 h-6" />
          <h3 class="text-lg font-semibold">Change Delegate</h3>
        </div>
        <div class="space-y-4">
          <div>
            <Label class="text-sm font-medium mb-2 block"
              >New Delegate Address</Label
            >
            <Input
              placeholder="Enter new delegate address..."
              v-model="newDelegateAddress"
              class="w-full font-mono text-sm"
              autocapitalize="none"
              autocomplete="off"
              spellcheck="false"
              :aria-invalid="
                newDelegateAddress.length > 0 &&
                !isValidAddress(newDelegateAddress)
              "
            />
          </div>
          <Button
            @click="changeDelegate()"
            :disabled="
              changingDelegate ||
              removingDelegate ||
              loadingCurrentDelegate ||
              !walletStore.getAddress ||
              !isValidAddress(newDelegateAddress)
            "
            class="w-full"
            :aria-busy="changingDelegate"
          >
            <Loader2
              v-if="changingDelegate"
              class="w-4 h-4 mr-2 animate-spin"
            />
            <Cookie v-else class="w-4 h-4 mr-2" />
            <span v-if="!changingDelegate" class="font-semibold"
              >Change Delegate</span
            >
            <span v-else>Changing...</span>
          </Button>
        </div>
      </div>

      <!-- Remove delegation section -->
      <div>
        <Button
          @click="removeDelegation()"
          :disabled="
            changingDelegate || removingDelegate || !walletStore.getAddress
          "
          variant="destructive"
          class="w-full"
          :aria-busy="removingDelegate"
        >
          <Loader2 v-if="removingDelegate" class="w-4 h-4 mr-2 animate-spin" />
          <Unlink v-else class="w-4 h-4 mr-2" />
          <span v-if="!removingDelegate" class="font-semibold"
            >Remove Delegation</span
          >
          <span v-else>Removing...</span>
        </Button>
      </div>
    </div>

    <!-- Delegate to new address section -->
    <div v-else class="w-full max-w-md">
      <div>
        <div class="flex items-center gap-1.5 mb-4">
          <Cookie class="w-6 h-6" />
          <h3 class="text-lg font-semibold">Delegate to Baker</h3>
        </div>
        <div class="space-y-4">
          <div>
            <Label class="text-sm font-medium mb-2 block"
              >Delegate Address</Label
            >
            <Input
              placeholder="Enter delegate address..."
              v-model="toAddress"
              class="w-full font-mono text-sm"
              autocapitalize="none"
              autocomplete="off"
              spellcheck="false"
              :aria-invalid="toAddress.length > 0 && !isValidAddress(toAddress)"
            />
          </div>
          <Button
            @click="delegateToCurrentAddress()"
            :disabled="
              sending || loadingCurrentDelegate || !walletStore.getAddress
            "
            class="w-full"
            :aria-busy="sending"
          >
            <Loader2
              v-if="
                sending || (loadingCurrentDelegate && walletStore.getAddress)
              "
              class="w-4 h-4 mr-2 animate-spin"
            />
            <Cookie v-else class="w-4 h-4" />
            <span v-if="!sending" class="font-semibold">Delegate</span>
            <span v-else>Delegating...</span>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDiagramStore } from "@/stores/diagramStore";
import { ref, onMounted, watch } from "vue";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, Unlink, Cookie } from "lucide-vue-next";
import {
  delegate,
  getDelegate,
  undelegate,
} from "@/modules/tests/tests/delegation/delegation";
import { useWalletStore } from "@/stores/walletStore";

const diagramStore = useDiagramStore();
const walletStore = useWalletStore();

const toAddress = ref<string>("tz1cjyja1TU6fiyiFav3mFAdnDsCReJ12hPD");
const newDelegateAddress = ref<string>("");
const sending = ref<boolean>(false);
const changingDelegate = ref<boolean>(false);
const removingDelegate = ref<boolean>(false);
const currentDelegate = ref<string | null>();
const loadingCurrentDelegate = ref<boolean>(true);
const tezosAddressPattern = /^(tz[1-4]|KT1)[0-9A-Za-z]{33}$/;
const isValidAddress = (value: string): boolean =>
  tezosAddressPattern.test(value.trim());

onMounted(async () => {
  diagramStore.setTestDiagram("delegation");
  await loadCurrentDelegate();
});

watch(
  () => walletStore.getAddress,
  async (newAddress) => {
    if (newAddress === undefined) {
      currentDelegate.value = undefined;
    }

    await loadCurrentDelegate();
  },
);

const loadCurrentDelegate = async () => {
  currentDelegate.value = await getCurrentDelegate();
  loadingCurrentDelegate.value = false;
};

const delegateToCurrentAddress = async () => {
  try {
    if (!isValidAddress(toAddress.value)) return;
    sending.value = true;
    await delegate(toAddress.value);
    currentDelegate.value = toAddress.value;
  } catch (error) {
    console.error(error);
  } finally {
    sending.value = false;
  }
};

const changeDelegate = async () => {
  try {
    if (!isValidAddress(newDelegateAddress.value)) return;
    changingDelegate.value = true;
    await delegate(newDelegateAddress.value);
    currentDelegate.value = newDelegateAddress.value;
    newDelegateAddress.value = "";
  } catch (error) {
    console.error(error);
  } finally {
    changingDelegate.value = false;
  }
};

const removeDelegation = async () => {
  try {
    removingDelegate.value = true;
    await undelegate();
    currentDelegate.value = undefined;
  } catch (error) {
    console.error(error);
  } finally {
    removingDelegate.value = false;
  }
};

const getCurrentDelegate = async () => {
  if (!walletStore.getAddress) {
    throw new Error("No current address found");
  }

  return await getDelegate(walletStore.getAddress);
};
</script>
