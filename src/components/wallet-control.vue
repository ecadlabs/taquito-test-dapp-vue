<template>
  <TooltipProvider>
    <div class="relative">
      <!-- Large Screens -->
      <div class="hidden md:block">
        <div v-if="!address" class="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger as-child>
              <span
                class="size-3 rounded-full bg-red-400"
                role="status"
                aria-label="Wallet disconnected"
                tabindex="0"
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>Wallet disconnected</p>
            </TooltipContent>
          </Tooltip>
          <Button variant="outline" @click="showConnectDialog = true">
            Connect Wallet
          </Button>
        </div>
        <div v-else class="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger as-child>
              <span
                class="size-3 rounded-full bg-green-400"
                role="status"
                :aria-label="
                  walletName
                    ? `Wallet connected (${walletName})`
                    : 'Wallet connected'
                "
                tabindex="0"
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {{
                  walletName
                    ? `Wallet connected (${walletName})`
                    : "Wallet connected"
                }}
              </p>
            </TooltipContent>
          </Tooltip>
          <Button
            variant="outline"
            @click="showDisconnectDialog = true"
            class="flex items-center gap-2"
          >
            <p v-if="balance">{{ `${balance} ꜩ` }}</p>
            <p v-else>...</p>
            <Separator v-if="address" orientation="vertical" class="h-4" />
            <p v-if="address">
              {{ address.slice(0, 6) }}...{{ address.slice(-4) }}
            </p>
          </Button>
        </div>
      </div>
      <!-- Small Screens -->
      <div class="block md:hidden">
        <div v-if="!address" class="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger as-child>
              <span
                class="size-3 rounded-full bg-red-400"
                role="status"
                aria-label="Wallet disconnected"
                tabindex="0"
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>Wallet disconnected</p>
            </TooltipContent>
          </Tooltip>
          <Button
            size="icon"
            variant="outline"
            @click="showConnectDialog = true"
            aria-label="Connect Wallet"
          >
            <Wallet class="size-5" aria-hidden="true" />
          </Button>
        </div>
        <div v-else class="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger as-child>
              <span
                class="size-3 rounded-full bg-green-400"
                role="status"
                :aria-label="
                  walletName
                    ? `Wallet connected (${walletName})`
                    : 'Wallet connected'
                "
                tabindex="0"
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {{
                  walletName
                    ? `Wallet connected (${walletName})`
                    : "Wallet connected"
                }}
              </p>
            </TooltipContent>
          </Tooltip>
          <Button
            size="icon"
            variant="outline"
            @click="showDisconnectDialog = true"
            aria-label="Disconnect Wallet"
          >
            <Unplug class="size-5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  </TooltipProvider>

  <!-- Connection Dialog -->
  <Dialog :open="showConnectDialog" @update:open="showConnectDialog = $event">
    <DialogContent>
      <!-- Provider Selection Step -->
      <div v-if="connectionStep === 'provider-selection'" class="space-y-4">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            Choose how Taquito connects and signs operations in this session.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-3">
          <div class="space-y-2">
            <Label :for="providerSelectId">Connection Method</Label>
            <Select v-model="provider">
              <SelectTrigger class="w-full" :id="providerSelectId">
                <SelectValue placeholder="Select a wallet provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beacon">Beacon</SelectItem>
                <SelectItem value="ledger">Ledger Device</SelectItem>
                <SelectItem value="web3auth">
                  Web3Auth (Social Login)
                </SelectItem>
                <SelectItem value="programmatic">
                  Raw Private Key Access
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Contextual Provider Details -->
          <div
            v-if="provider === 'beacon'"
            class="bg-muted/40 space-y-1.5 rounded-lg border p-3 text-xs"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-foreground font-medium"
                >Browser, Web &amp; Mobile Wallets</span
              >
              <Badge variant="outline" class="font-mono text-[11px]"
                >@taquito/beacon-wallet</Badge
              >
            </div>
            <p class="text-muted-foreground leading-relaxed">
              Standard dApp wallet integration via
              <a
                href="https://github.com/ecadlabs/beacon-sdk-taquito-patches"
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-500 hover:underline dark:text-blue-400"
                >Beacon</a
              >, supporting browser extensions (Temple, Kukai), web wallets, and
              <a
                href="https://walletconnect.network/"
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-500 hover:underline dark:text-blue-400"
                >WalletConnect</a
              >
              mobile or QR wallets. Every operation prompts your wallet for
              confirmation.
            </p>
          </div>

          <div
            v-else-if="provider === 'ledger'"
            class="bg-muted/40 space-y-1.5 rounded-lg border p-3 text-xs"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-foreground font-medium"
                >Hardware Wallet via WebHID</span
              >
              <Badge variant="outline" class="font-mono text-[11px]"
                >@taquito/ledger-signer</Badge
              >
            </div>
            <p class="text-muted-foreground leading-relaxed">
              Connects directly to a Ledger device over USB (Chromium browsers
              required). Operations require physical approval on your hardware
              wallet.
            </p>
          </div>

          <div
            v-else-if="provider === 'web3auth'"
            class="bg-muted/40 space-y-1.5 rounded-lg border p-3 text-xs"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-foreground font-medium"
                >Social Login Key Derivation</span
              >
              <Badge variant="outline" class="font-mono text-[11px]"
                >@taquito/signer</Badge
              >
            </div>
            <p class="text-muted-foreground leading-relaxed">
              Derives a key in memory from a social login via Web3Auth. Included
              for demonstration; operations are signed automatically without
              confirmation prompts.
            </p>
          </div>

          <div
            v-else-if="provider === 'programmatic'"
            class="bg-muted/40 space-y-1.5 rounded-lg border p-3 text-xs"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-foreground font-medium"
                >Direct In-Memory Signer</span
              >
              <Badge variant="outline" class="font-mono text-[11px]"
                >@taquito/signer</Badge
              >
            </div>
            <p class="text-muted-foreground leading-relaxed">
              Signs operations directly in memory without confirmation prompts.
              Intended for automated test scripts and disposable testnet keys
              only.
            </p>
          </div>

          <Alert v-if="provider === 'ledger' && !hidSupported">
            <AlertTriangle class="size-4 !text-red-500" aria-hidden="true" />
            <AlertTitle>Browser not supported</AlertTitle>
            <AlertDescription>
              WebHID is required to communicate with a Ledger device. Please use
              a Chromium-based browser (Chrome, Edge, or Brave).
            </AlertDescription>
          </Alert>

          <Alert v-if="provider === 'programmatic' || provider === 'web3auth'">
            <AlertTriangle class="size-4 !text-red-500" aria-hidden="true" />
            <AlertTitle>Testing &amp; demonstration only</AlertTitle>
            <AlertDescription>
              <span v-if="provider === 'programmatic'">
                Never enter a real personal secret key. Operations will execute
                immediately without wallet confirmation.
              </span>
              <span v-else>
                Web3Auth relays a derived private key directly to the app, so
                operations execute without confirmation prompts.
              </span>
            </AlertDescription>
          </Alert>

          <div v-if="provider === 'programmatic'" class="space-y-2">
            <Label :for="privateKeyInputId">Private Key</Label>
            <Input
              :id="privateKeyInputId"
              v-model="privateKey"
              type="text"
              placeholder="edsk..."
              class="w-full font-mono text-xs"
              autocomplete="off"
              spellcheck="false"
              :aria-describedby="privateKeyHelpId"
            />
            <p :id="privateKeyHelpId" class="text-muted-foreground text-xs">
              Stored only in memory for this session. Provide a throwaway
              testnet key (`edsk...`, `spsk...`, `p2sk...`, or `blsk...`).
            </p>
          </div>

          <p class="text-muted-foreground text-xs">
            Tip: Production dApps typically only need
            <span class="text-foreground font-medium">Beacon</span> as a single
            wallet integration. The direct signers above are provided here for
            testing and hardware workflows.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            @click="provider === 'ledger' ? nextStep() : connect()"
            :disabled="
              loading ||
              !provider ||
              (provider === 'programmatic' && !privateKey) ||
              (provider === 'ledger' && !hidSupported)
            "
            :aria-busy="loading"
          >
            <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            <p>{{ provider === "ledger" ? "Next" : "Connect" }}</p>
          </Button>
        </DialogFooter>
      </div>

      <!-- Ledger Preparation Step -->
      <LedgerPreparationStep
        v-else-if="connectionStep === 'ledger-preparation'"
        :loading="loading"
        :hid-supported="hidSupported"
        @back="backToProviderSelection"
        @connect="connect"
      />

      <!-- Ledger Waiting Step -->
      <LedgerWaitingStep
        v-else-if="connectionStep === 'ledger-waiting'"
        :loading="loading"
      />
    </DialogContent>
  </Dialog>

  <!-- Disconnection Dialog -->
  <Dialog
    :open="showDisconnectDialog"
    @update:open="showDisconnectDialog = $event"
  >
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Connected Wallet</DialogTitle>
        <DialogDescription>
          Connected via
          <span class="text-foreground font-medium">{{
            walletName || "Active Wallet"
          }}</span>
        </DialogDescription>
      </DialogHeader>

      <div class="bg-muted/40 space-y-2 rounded-lg border p-3 text-sm">
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <p class="text-muted-foreground text-xs">Address</p>
            <p class="font-mono text-xs break-all">{{ address }}</p>
          </div>
          <div class="flex flex-shrink-0 gap-1">
            <Button
              variant="ghost"
              size="icon"
              @click="copyAddress()"
              aria-label="Copy wallet address"
            >
              <Copy class="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              @click="openExplorer()"
              aria-label="Open wallet in explorer"
            >
              <ExternalLink class="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <Separator />

        <div class="flex items-center justify-between">
          <span class="text-muted-foreground text-xs">Balance</span>
          <span class="font-medium">{{ balance }} ꜩ</span>
        </div>
      </div>

      <DialogFooter class="flex flex-col gap-2">
        <Button
          variant="secondary"
          @click="change()"
          :disabled="loading"
          :aria-busy="loading"
        >
          <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          <p>Change Wallet</p>
        </Button>
        <Button
          variant="destructive"
          @click="disconnect()"
          :disabled="loading"
          :aria-busy="loading"
        >
          <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          <p>Disconnect</p>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useWalletStore } from "@/stores/walletStore";
import type { WalletProvider } from "@/types/wallet";
import {
  AlertTriangle,
  Copy,
  ExternalLink,
  Loader2,
  Unplug,
  Wallet,
} from "lucide-vue-next";
import { computed, ref, watch } from "vue";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { buildIndexerUrl } from "@/lib/utils";
import { formatBeaconError } from "@/lib/walletEvents";
import { useSettingsStore } from "@/stores/settingsStore";
import { toast } from "vue-sonner";

const walletStore = useWalletStore();
const settingsStore = useSettingsStore();

const address = computed(() => walletStore.getAddress);
const walletName = computed(() => walletStore.getWalletName);
const balance = computed(() => {
  if (walletStore.getBalance) {
    const balanceTez = walletStore.getBalance.toNumber() / 1000000;
    return balanceTez.toLocaleString(undefined, {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  }

  return 0;
});

const provider = ref<WalletProvider>("beacon");
const loading = ref<boolean>(false);
const showConnectDialog = ref<boolean>(false);
const showDisconnectDialog = ref<boolean>(false);
const privateKey = ref<string>("");
const connectionStep = ref<
  "provider-selection" | "ledger-preparation" | "ledger-waiting"
>("provider-selection");
const providerSelectId = "wallet-provider-select";
const privateKeyInputId = "programmatic-private-key";
const privateKeyHelpId = "programmatic-private-key-help";

watch([showConnectDialog, showDisconnectDialog], ([newValue]) => {
  if (newValue === false) {
    loading.value = false;
    connectionStep.value = "provider-selection";
  }
});

const copyAddress = () => {
  navigator.clipboard.writeText(walletStore.getAddress ?? "");
  toast.success("Address copied to clipboard");
};

const networkType = import.meta.env.VITE_NETWORK_TYPE;
const networkName = import.meta.env.VITE_NETWORK_NAME;

const openExplorer = () => {
  const operationsUrl = buildIndexerUrl(
    settingsStore.settings.indexer,
    networkType,
    address.value,
    "operations",
    networkName,
  );
  window.open(operationsUrl, "_blank");
};

const connect = async () => {
  try {
    loading.value = true;

    // For Ledger, show waiting step first
    if (provider.value === "ledger") {
      connectionStep.value = "ledger-waiting";
    }

    // All providers now use the unified initializeWallet function
    await walletStore.initializeWallet(provider.value, privateKey.value);

    toast.success("Wallet connected");
    showConnectDialog.value = false;
    loading.value = false;
  } catch (error) {
    // Handle errors differently for Ledger vs other providers
    if (provider.value === "ledger") {
      // For Ledger, go back to preparation step and show error
      connectionStep.value = "ledger-preparation";
      toast.error("Ledger connection failed", {
        description: formatBeaconError(error),
      });
    } else {
      // For other providers, just show error and close dialog
      toast.error("Wallet connection failed", {
        description: formatBeaconError(error),
      });
      showConnectDialog.value = false;
    }
    loading.value = false;
  }
};

const disconnect = async () => {
  try {
    loading.value = true;

    await walletStore.disconnectWallet();
    toast.success("Wallet disconnected");
  } catch (error) {
    toast.error("Wallet disconnection failed", {
      description: formatBeaconError(error),
    });
  } finally {
    showDisconnectDialog.value = false;
    loading.value = false;
  }
};

const change = async () => {
  await disconnect();
  showConnectDialog.value = true;
};

const nextStep = () => {
  if (provider.value === "ledger") {
    connectionStep.value = "ledger-preparation";
  }
};

const backToProviderSelection = () => {
  connectionStep.value = "provider-selection";
};

const hidSupported = computed(() => {
  return "hid" in navigator;
});
</script>
