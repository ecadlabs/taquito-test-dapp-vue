<template>
  <div class="flex w-full flex-col items-center gap-6 px-6">
    <!-- Baker warning alert -->
    <Alert
      v-if="isRegisteredAsBaker"
      variant="destructive"
      class="w-full max-w-md"
    >
      <AlertTriangle class="h-4 w-4" />
      <AlertTitle>Registered as Baker</AlertTitle>
      <AlertDescription>
        You're currently registered as a baker (delegating to yourself). Tezos
        does not currently allow you to un-register as a baker. To use this test
        you'll need to use a different account.
      </AlertDescription>
    </Alert>

    <!-- Current delegate section -->
    <div v-if="currentDelegate" class="w-full max-w-md space-y-2">
      <!-- Display current delegate -->
      <div class="mb-4">
        <div class="mb-2 flex items-center gap-3">
          <CheckCircle class="h-6 w-6 text-green-500" />
          <h3 class="text-lg font-semibold">Current Delegate</h3>
        </div>
        <p
          class="bg-muted w-fit rounded-md px-2 py-1 font-mono text-xs text-red-400"
          role="status"
          aria-live="polite"
        >
          {{ currentDelegate }}
        </p>
      </div>

      <!-- Change delegate section -->
      <div>
        <div class="mb-4 flex items-center gap-1.5">
          <Cookie class="h-6 w-6" />
          <h3 class="text-lg font-semibold">Change Delegate</h3>
        </div>
        <div class="space-y-4">
          <div>
            <Label class="mb-2 block text-sm font-medium"
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
              class="mr-2 h-4 w-4 animate-spin"
            />
            <Cookie v-else class="mr-2 h-4 w-4" />
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
            changingDelegate ||
            removingDelegate ||
            !walletStore.getAddress ||
            isRegisteredAsBaker
          "
          variant="destructive"
          class="w-full"
          :aria-busy="removingDelegate"
        >
          <Loader2 v-if="removingDelegate" class="mr-2 h-4 w-4 animate-spin" />
          <Unlink v-else class="mr-2 h-4 w-4" />
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
        <div class="mb-4 flex items-center gap-1.5">
          <Cookie class="h-6 w-6" />
          <h3 class="text-lg font-semibold">Delegate to Baker</h3>
        </div>
        <div class="space-y-4">
          <div>
            <Label class="mb-2 block text-sm font-medium"
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
              sending ||
              loadingCurrentDelegate ||
              !walletStore.getAddress ||
              isRegisteredAsBaker
            "
            class="w-full"
            :aria-busy="sending"
          >
            <Loader2
              v-if="
                sending || (loadingCurrentDelegate && walletStore.getAddress)
              "
              class="mr-2 h-4 w-4 animate-spin"
            />
            <Cookie v-else class="h-4 w-4" />
            <span v-if="!sending" class="font-semibold">Delegate</span>
            <span v-else>Delegating...</span>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateTezosAddress } from "@/lib/utils";
import {
  delegate,
  getDelegate,
  undelegate,
} from "@/modules/tests/tests/delegation/delegation";
import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import {
  AlertTriangle,
  CheckCircle,
  Cookie,
  Loader2,
  Unlink,
} from "lucide-vue-next";
import { computed, onMounted, ref, watch } from "vue";

const diagramStore = useDiagramStore();
const walletStore = useWalletStore();

const toAddress = ref<string>("tz1cjyja1TU6fiyiFav3mFAdnDsCReJ12hPD");
const newDelegateAddress = ref<string>("");
const sending = ref<boolean>(false);
const changingDelegate = ref<boolean>(false);
const removingDelegate = ref<boolean>(false);
const currentDelegate = ref<string | null>();
const loadingCurrentDelegate = ref<boolean>(true);
const isValidAddress = (value: string): boolean =>
  validateTezosAddress(value.trim());

const isRegisteredAsBaker = computed(() => {
  return (
    currentDelegate.value &&
    walletStore.getAddress &&
    currentDelegate.value === walletStore.getAddress
  );
});

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
  if (walletStore.getAddress) {
    return await getDelegate(walletStore.getAddress);
  }

  return null;
};
</script>
