<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent>
      <!-- Provider Selection Step -->
      <div v-if="connectionStep === 'provider-selection'">
        <DialogHeader>
          <DialogTitle>Connect Tezlink Wallet</DialogTitle>
          <DialogDescription>
            Choose how to connect your wallet to the Tezlink network.
          </DialogDescription>
        </DialogHeader>

        <div class="mt-4 space-y-4">
          <!-- Use L1 Wallet Option -->
          <button
            v-if="l1Provider && l1Provider !== 'web3auth'"
            class="border-primary/20 hover:border-primary hover:bg-primary/5 flex w-full items-center gap-3 rounded-lg border-2 p-4 text-left transition-colors"
            :class="{
              'border-primary bg-primary/5': selectedOption === 'use-l1',
            }"
            @click="selectedOption = 'use-l1'"
          >
            <div
              class="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100"
            >
              <Link class="size-5 text-blue-600" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-medium">Use my L1 wallet</p>
              <p class="text-muted-foreground text-sm">
                Connect with the same wallet as your Tezos L1 ({{
                  formatProviderName(l1Provider)
                }})
              </p>
            </div>
            <div
              v-if="selectedOption === 'use-l1'"
              class="bg-primary flex size-5 shrink-0 items-center justify-center rounded-full"
            >
              <Check class="size-3 text-white" />
            </div>
          </button>

          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <span class="w-full border-t" />
            </div>
            <div class="relative flex justify-center text-xs uppercase">
              <span class="bg-background text-muted-foreground px-2">
                Or choose a different wallet
              </span>
            </div>
          </div>

          <!-- Other Provider Options -->
          <div class="space-y-2">
            <button
              class="border-border hover:border-primary/50 hover:bg-muted/50 flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors"
              :class="{
                'border-primary bg-primary/5': selectedOption === 'beacon',
              }"
              @click="selectedOption = 'beacon'"
            >
              <div
                class="flex size-8 shrink-0 items-center justify-center rounded-full bg-orange-100"
              >
                <Radio class="size-4 text-orange-600" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium">Beacon</p>
                <p class="text-muted-foreground text-xs">
                  Temple, Kukai, and other Beacon wallets
                </p>
              </div>
              <div
                v-if="selectedOption === 'beacon'"
                class="bg-primary flex size-5 shrink-0 items-center justify-center rounded-full"
              >
                <Check class="size-3 text-white" />
              </div>
            </button>

            <button
              class="border-border hover:border-primary/50 hover:bg-muted/50 flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors"
              :class="{
                'border-primary bg-primary/5':
                  selectedOption === 'walletconnect',
              }"
              @click="selectedOption = 'walletconnect'"
            >
              <div
                class="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100"
              >
                <Smartphone class="size-4 text-blue-600" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium">WalletConnect</p>
                <p class="text-muted-foreground text-xs">
                  Connect via QR code or deep link
                </p>
              </div>
              <div
                v-if="selectedOption === 'walletconnect'"
                class="bg-primary flex size-5 shrink-0 items-center justify-center rounded-full"
              >
                <Check class="size-3 text-white" />
              </div>
            </button>

            <button
              class="border-border hover:border-primary/50 hover:bg-muted/50 flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors"
              :class="{
                'border-primary bg-primary/5': selectedOption === 'ledger',
              }"
              :disabled="!hidSupported"
              @click="selectedOption = 'ledger'"
            >
              <div
                class="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-100"
              >
                <HardDrive class="size-4 text-gray-600" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium">Ledger</p>
                <p class="text-muted-foreground text-xs">
                  {{
                    hidSupported
                      ? "Connect your hardware wallet"
                      : "Not supported on this browser"
                  }}
                </p>
              </div>
              <div
                v-if="selectedOption === 'ledger'"
                class="bg-primary flex size-5 shrink-0 items-center justify-center rounded-full"
              >
                <Check class="size-3 text-white" />
              </div>
            </button>

            <button
              class="border-border hover:border-primary/50 hover:bg-muted/50 flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors"
              :class="{
                'border-primary bg-primary/5':
                  selectedOption === 'programmatic',
              }"
              @click="selectedOption = 'programmatic'"
            >
              <div
                class="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-100"
              >
                <KeyRound class="size-4 text-red-600" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium">Private Key</p>
                <p class="text-muted-foreground text-xs">
                  For testing only - enter a private key directly
                </p>
              </div>
              <div
                v-if="selectedOption === 'programmatic'"
                class="bg-primary flex size-5 shrink-0 items-center justify-center rounded-full"
              >
                <Check class="size-3 text-white" />
              </div>
            </button>
          </div>

          <!-- Private Key Input -->
          <div v-if="selectedOption === 'programmatic'" class="space-y-2">
            <Alert>
              <AlertTriangle class="size-4 !text-red-500" />
              <AlertTitle>Testing Only</AlertTitle>
              <AlertDescription>
                Raw private key access is for testing purposes only. Do not use
                with real funds.
              </AlertDescription>
            </Alert>
            <Label for="tezlink-private-key">Private Key</Label>
            <Input
              id="tezlink-private-key"
              v-model="privateKey"
              type="text"
              placeholder="edsk..."
              autocomplete="off"
              spellcheck="false"
            />
          </div>
        </div>

        <DialogFooter class="mt-4">
          <Button
            @click="handleConnect"
            :disabled="!canConnect || loading"
            :aria-busy="loading"
          >
            <Loader2 v-if="loading" class="mr-2 size-4 animate-spin" />
            {{ selectedOption === "ledger" ? "Next" : "Connect" }}
          </Button>
        </DialogFooter>
      </div>

      <!-- Ledger Preparation Step -->
      <LedgerPreparationStep
        v-else-if="connectionStep === 'ledger-preparation'"
        :loading="loading"
        :hid-supported="hidSupported"
        @back="connectionStep = 'provider-selection'"
        @connect="connectLedger"
      />

      <!-- Ledger Waiting Step -->
      <LedgerWaitingStep
        v-else-if="connectionStep === 'ledger-waiting'"
        :loading="loading"
      />
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LedgerPreparationStep from "@/components/ui/ledger-preparation-step.vue";
import LedgerWaitingStep from "@/components/ui/ledger-waiting-step.vue";
import { useTezlinkWalletStore } from "@/stores/tezlinkWalletStore";
import { useWalletStore } from "@/stores/walletStore";
import type { WalletProvider } from "@/types/wallet";
import {
  AlertTriangle,
  Check,
  HardDrive,
  KeyRound,
  Link,
  Loader2,
  Radio,
  Smartphone,
} from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { toast } from "vue-sonner";

type ConnectionOption = "use-l1" | WalletProvider;

interface Props {
  open: boolean;
}

interface Emits {
  (e: "update:open", value: boolean): void;
  (e: "connected"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const walletStore = useWalletStore();
const tezlinkWalletStore = useTezlinkWalletStore();

const selectedOption = ref<ConnectionOption | null>(null);
const privateKey = ref("");
const loading = ref(false);
const connectionStep = ref<
  "provider-selection" | "ledger-preparation" | "ledger-waiting"
>("provider-selection");

const l1Provider = computed(
  () => walletStore.getProvider as WalletProvider | null,
);

const hidSupported = computed(() => "hid" in navigator);

const canConnect = computed(() => {
  if (!selectedOption.value) return false;
  if (selectedOption.value === "programmatic" && !privateKey.value)
    return false;
  if (selectedOption.value === "ledger" && !hidSupported.value) return false;
  return true;
});

// Reset state when dialog opens/closes
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      loading.value = false;
      connectionStep.value = "provider-selection";
    } else {
      // Pre-select "use L1" if L1 wallet is connected
      if (l1Provider.value && l1Provider.value !== "web3auth") {
        selectedOption.value = "use-l1";
      } else {
        selectedOption.value = null;
      }
      privateKey.value = "";
    }
  },
);

function formatProviderName(provider: WalletProvider | null): string {
  if (!provider) return "";
  const names: Record<WalletProvider, string> = {
    beacon: "Beacon",
    walletconnect: "WalletConnect",
    ledger: "Ledger",
    programmatic: "Private Key",
    web3auth: "Web3Auth",
  };
  return names[provider] || provider;
}

async function handleConnect() {
  if (!selectedOption.value) return;

  if (selectedOption.value === "ledger") {
    connectionStep.value = "ledger-preparation";
    return;
  }

  await connect();
}

async function connectLedger() {
  connectionStep.value = "ledger-waiting";
  await connect();
}

async function connect() {
  if (!selectedOption.value) return;

  loading.value = true;

  try {
    let provider: WalletProvider;
    let secretKey: string | undefined;

    if (selectedOption.value === "use-l1") {
      if (!l1Provider.value) return;
      provider = l1Provider.value;
      // If L1 uses programmatic wallet, get the secret key
      if (provider === "programmatic") {
        secretKey = await walletStore.getTezos.signer.secretKey();
      }
    } else {
      provider = selectedOption.value;
      if (provider === "programmatic") {
        secretKey = privateKey.value;
      }
    }

    await tezlinkWalletStore.initializeWallet(provider, secretKey);

    toast.success("Tezlink wallet connected");
    emit("update:open", false);
    emit("connected");
  } catch (error) {
    console.error("Failed to connect Tezlink wallet:", error);

    if (
      selectedOption.value === "ledger" ||
      (selectedOption.value === "use-l1" && l1Provider.value === "ledger")
    ) {
      connectionStep.value = "ledger-preparation";
      toast.error("Ledger connection failed", {
        description: error instanceof Error ? error.message : String(error),
      });
    } else {
      toast.error("Failed to connect wallet", {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  } finally {
    loading.value = false;
  }
}
</script>
