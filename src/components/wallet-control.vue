<template>
  <div class="relative">
    <!-- Large Screens -->
    <div class="hidden md:block">
      <div v-if="!address" class="flex items-center gap-2">
        <div class="size-3 rounded-full bg-red-400" aria-hidden="true" />
        <p class="sr-only">Wallet Disconnected</p>
        <Button variant="outline" @click="showConnectDialog = true">
          Connect Wallet
        </Button>
      </div>
      <div v-else class="flex items-center gap-2">
        <div class="size-3 rounded-full bg-green-400" aria-hidden="true" />
        <p class="sr-only">Wallet Connected</p>
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
        <div class="size-3 rounded-full bg-red-400" aria-hidden="true" />
        <p class="sr-only">Wallet Disconnected</p>
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
        <div class="size-3 rounded-full bg-green-400" aria-hidden="true" />
        <p class="sr-only">Wallet Connected</p>
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

  <!-- Connection Dialog -->
  <Dialog :open="showConnectDialog" @update:open="showConnectDialog = $event">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Connect Wallet</DialogTitle>
        <DialogDescription>
          <div>
            <div class="flex flex-wrap items-center space-x-1 text-left">
              <span>Taquito Playground supports both</span>
              <a
                href="https://www.walletbeacon.io/"
                target="_blank"
                class="text-blue-400 hover:underline"
                >Beacon</a
              >
              <span>and</span>
              <a
                href="https://walletconnect.network/"
                target="_blank"
                class="text-blue-400 hover:underline"
                >WalletConnect.</a
              >
              <p>Select your preference and hit connect to get started.</p>
            </div>

            <p class="mt-2 text-left italic">
              Just a note: when building your own dApp, you shouldn't use both
              Beacon and WalletConnect. Instead, you should pick one that works
              best for your use-case. We use both here for testing and
              illustration purposes, but this is not best practice in production
              applications.
            </p>
          </div>
        </DialogDescription>
      </DialogHeader>

      <div>
        <Alert v-if="provider === 'ledger' && hidSupported" class="mb-2">
          <AlertTriangle class="size-4 !text-yellow-500" />
          <AlertTitle>
            <p>Important</p>
          </AlertTitle>
          <AlertDescription class="inline-block"
            >Use of an HID (your Ledger device) within this browser requires the
            <code class="bg-muted rounded px-1 py-0.5 font-mono text-xs"
              >enable-experimental-web-platform-features</code
            >
            experimental flag to be enabled. Learn more
            <a
              href="https://developer.chrome.com/docs/web-platform/chrome-flags"
              target="_blank"
              class="text-blue-400 hover:underline"
              >here.
            </a>
          </AlertDescription>
        </Alert>
        <Alert v-if="provider === 'ledger' && !hidSupported" class="mb-2">
          <AlertTriangle class="size-4 !text-red-500" aria-hidden="true" />
          <AlertTitle>
            <p>Heads up!</p>
          </AlertTitle>
          <AlertDescription>
            The API's used to connect to the Ledger device are not supported on
            this browser. Please use a Chromium-based browser to connect to the
            Ledger device.
          </AlertDescription>
        </Alert>
        <Alert v-if="provider === 'programmatic'" class="mb-2">
          <AlertTriangle class="size-4 !text-red-500" aria-hidden="true" />
          <AlertTitle>
            <p>Important!</p>
          </AlertTitle>
          <AlertDescription>
            Raw private key access is designed for testing purposes only, such
            as automated test scripts. It has less security measures and will
            NOT ask for confirmation before carrying out operations. This should
            not be used with a real, personally owned wallet key.
          </AlertDescription>
        </Alert>
        <div class="space-y-2">
          <Label :for="providerSelectId">Wallet Provider</Label>
          <Select v-model="provider">
            <SelectTrigger class="w-[220px]" :id="providerSelectId">
              <SelectValue placeholder="Select a wallet provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beacon"> Beacon </SelectItem>
              <SelectItem value="walletconnect"> WalletConnect </SelectItem>
              <SelectItem value="ledger"> Ledger Device </SelectItem>
              <SelectItem value="programmatic">
                Raw Private Key Access
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div v-if="provider === 'programmatic'" class="mt-2 space-y-2">
          <Label :for="privateKeyInputId"> Private Key </Label>
          <Input
            :id="privateKeyInputId"
            v-model="privateKey"
            type="text"
            placeholder="edsk..."
            class="w-full"
            autocomplete="off"
            spellcheck="false"
            :aria-describedby="privateKeyHelpId"
          />
          <p :id="privateKeyHelpId" class="text-muted-foreground text-xs">
            Stored only in-memory for this demo. Provide a throwaway key.
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="secondary"
          @click="connect()"
          :disabled="
            loading ||
            !provider ||
            (provider === 'programmatic' && !privateKey) ||
            (provider === 'ledger' && !hidSupported)
          "
          :aria-busy="loading"
        >
          <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          <p>Connect</p>
        </Button>
      </DialogFooter>
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
        <DialogDescription class="flex gap-1">
          <p>Connected to</p>
          <p class="font-medium">{{ walletName }}</p>
        </DialogDescription>
      </DialogHeader>

      <div class="text-sm">
        <div class="flex items-center gap-1">
          <div class="min-w-0">
            <p class="break-all">Address: {{ address }}</p>
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

        <p>Balance: {{ balance }} ꜩ</p>
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { buildIndexerUrl } from "@/lib/utils";
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
const providerSelectId = "wallet-provider-select";
const privateKeyInputId = "programmatic-private-key";
const privateKeyHelpId = "programmatic-private-key-help";

watch([showConnectDialog, showDisconnectDialog], ([newValue]) => {
  if (newValue === false) {
    loading.value = false;
  }
});

const copyAddress = () => {
  navigator.clipboard.writeText(walletStore.getAddress ?? "");
  toast.success("Address copied to clipboard");
};

const networkType = import.meta.env.VITE_NETWORK_TYPE;

const openExplorer = () => {
  const operationsUrl = buildIndexerUrl(
    settingsStore.settings.indexer,
    networkType,
    address.value,
    "operations",
  );
  window.open(operationsUrl, "_blank");
};

const connect = async () => {
  try {
    loading.value = true;
    await walletStore.initializeWallet(provider.value, privateKey.value);
    toast.success("Wallet connected");
  } catch (error) {
    toast.error("Wallet connection failed", {
      description: error instanceof Error ? error.message : String(error),
    });
  } finally {
    showConnectDialog.value = false;
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
      description: error instanceof Error ? error.message : String(error),
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

const hidSupported = computed(() => {
  return "hid" in navigator;
});
</script>
