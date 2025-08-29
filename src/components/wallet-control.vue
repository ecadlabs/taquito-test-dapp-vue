<template>
  <div class="relative">
    <!-- Large Screens -->
    <div class="hidden md:block">
      <div v-if="!address" class="flex items-center gap-2">
        <div class="size-3 rounded-full bg-red-400" />
        <p class="sr-only">Wallet Disconnected</p>
        <Button variant="outline" @click="showConnectDialog = true">
          Connect Wallet
        </Button>
      </div>
      <div v-else class="flex items-center gap-2">
        <div class="size-3 rounded-full bg-green-400" />
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
          <AlertTriangle
            v-if="!settingsStore.getIsRevealed"
            class="size-4 text-red-600 flex-shrink-0"
          />
        </Button>
      </div>
    </div>
    <!-- Small Screens -->
    <div class="block md:hidden">
      <div v-if="!address" class="flex items-center gap-2">
        <div class="size-3 rounded-full bg-red-400" />
        <p class="sr-only">Wallet Disconnected</p>
        <Button size="icon" variant="outline" @click="showConnectDialog = true">
          <p class="sr-only">Connect Wallet</p>
          <Wallet class="size-5" />
        </Button>
      </div>
      <div v-else class="flex items-center gap-2">
        <div class="size-3 rounded-full bg-green-400" />
        <p class="sr-only">Wallet Connected</p>
        <Button
          size="icon"
          variant="outline"
          @click="showDisconnectDialog = true"
        >
          <p class="sr-only">Disconnect Wallet</p>
          <Unplug class="size-5" />
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
            <div class="flex space-x-1 items-center flex-wrap">
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

            <p class="mt-2 italic">
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
        <Alert v-if="provider === 'programmatic'" class="mb-2">
          <AlertTriangle class="size-4 !text-red-500" />
          <AlertTitle>
            <p>Important!</p>
          </AlertTitle>
          <AlertDescription>
            The programmatic wallet is designed for testing purposes only, such
            as automated test scripts. It has less security measures and will
            NOT ask for confirmation before carrying out operations. This should
            not be used with a real, personally owned wallet key.
          </AlertDescription>
        </Alert>
        <Select v-model="provider">
          <SelectTrigger class="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="beacon"> Beacon </SelectItem>
            <SelectItem value="walletconnect"> WalletConnect </SelectItem>
            <SelectItem value="ledger"> Ledger Device </SelectItem>
            <SelectItem value="programmatic">
              Programmatic (Testing)
            </SelectItem>
          </SelectContent>
        </Select>

        <Input
          v-if="provider === 'programmatic'"
          v-model="privateKey"
          type="text"
          placeholder="Private Key"
          class="w-1/2 mt-2"
        />
      </div>

      <DialogFooter>
        <Button
          variant="secondary"
          @click="connect()"
          :disabled="
            loading || !provider || (provider === 'programmatic' && !privateKey)
          "
        >
          <Loader2 v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
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

      <!-- Warning for unrevealed wallet -->
      <div
        v-if="!settingsStore.getIsRevealed"
        class="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5"
      >
        <div class="flex items-start gap-1.5">
          <AlertTriangle class="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <p class="text-sm font-medium text-yellow-800">
              Wallet key not revealed
            </p>
            <div class="text-xs text-yellow-700 mt-1">
              <p>
                Your wallets public key has not been revealed on the blockchain.
                Most operations will fail. Reveal your key by sending a
                transaction to yourself via your wallet.
              </p>
              <p class="mt-1">
                Learn more from the
                <a
                  href="https://docs.tezos.com/tutorials/build-your-first-app/wallets-tokens"
                  target="_blank"
                  class="text-blue-400 hover:underline"
                  >Tezos documentation</a
                >.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="text-sm">
        <div class="flex items-center gap-1">
          <div class="min-w-0">
            <p class="break-all">Address: {{ address }}</p>
          </div>
          <div class="flex gap-1 flex-shrink-0">
            <Button variant="ghost" size="icon" @click="copyAddress()">
              <Copy class="size-4" />
              <p class="sr-only">Copy wallet address</p>
            </Button>
            <Button variant="ghost" size="icon" @click="openExplorer()">
              <ExternalLink class="size-4" />
              <p class="sr-only">Open wallet in explorer</p>
            </Button>
          </div>
        </div>

        <p>Balance: {{ balance }} ꜩ</p>
      </div>

      <DialogFooter class="flex flex-col gap-2">
        <Button variant="secondary" @click="change()" :disabled="loading">
          <Loader2 v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
          <p>Change Wallet</p>
        </Button>
        <Button variant="destructive" @click="disconnect()" :disabled="loading">
          <Loader2 v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
          <p>Disconnect</p>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useWalletStore } from "@/stores/walletStore";
import { computed, ref, watch } from "vue";
import type { WalletProvider } from "@/types/wallet";
import {
  Loader2,
  Wallet,
  Unplug,
  Copy,
  ExternalLink,
  AlertTriangle,
} from "lucide-vue-next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "vue-sonner";
import { buildIndexerUrl } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settingsStore";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

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

watch([showConnectDialog, showDisconnectDialog], ([newValue]) => {
  if (newValue === false) {
    loading.value = false;
  }
});

const copyAddress = () => {
  navigator.clipboard.writeText(address.value ?? "");
  toast.success("Address copied to clipboard");
};

const networkType = import.meta.env.VITE_NETWORK_TYPE;
const indexerUrl = computed(() =>
  buildIndexerUrl(settingsStore.settings.indexer, networkType),
);

const openExplorer = () => {
  window.open(`${indexerUrl.value}/${address.value}/operations`, "_blank");
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
</script>
