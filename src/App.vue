<template>
  <Web3AuthProvider :config="web3AuthContextConfig">
    <Toaster />
    <div id="app">
      <header class="bg-background sticky top-0 z-20">
        <HeaderComponent />
      </header>
      <main>
        <router-view />
      </main>
    </div>

    <!-- Global Command Palette -->
    <CommandMenu />
  </Web3AuthProvider>
</template>

<script setup lang="ts">
import CommandMenu from "@/components/command-menu.vue";
import HeaderComponent from "@/components/header-component.vue";
import { Toaster } from "@/components/ui/sonner";
import { useFavicon } from "@/composables/useFavicon";
import { useTheme } from "@/composables/useTheme";
import { useEthereumWalletStore } from "@/stores/ethereumWalletStore";
import { useWalletStore } from "@/stores/walletStore";
import web3AuthContextConfig from "@/web3authContext";
import { Web3AuthProvider } from "@web3auth/modal/vue";
import { onMounted, onUnmounted } from "vue";
import "vue-sonner/style.css";

const walletStore = useWalletStore();
const ethereumWalletStore = useEthereumWalletStore();

useFavicon();
useTheme();

onMounted(async () => {
  // Initialize Ethereum wallet store (event listeners)
  await ethereumWalletStore.initialize();

  // We check what the last provider they used was, then also check if they still have a saved session with that provider.
  // If they do, we can re-initialize the session without showing the wallet authentication flow.
  const provider = localStorage.getItem("wallet-provider");

  if (provider === "beacon") {
    const beaconActiveAccount = localStorage.getItem("beacon:active-account");
    if (beaconActiveAccount !== "undefined") {
      walletStore.initializeWallet("beacon");
    }
  } else if (provider === "walletconnect") {
    // TODO: pass a disabled state to the connect button while this is loading
    const walletConnectActiveSession =
      await walletStore.getWalletConnectSessionFromIndexedDB();
    if (walletConnectActiveSession !== undefined) {
      walletStore.initializeWallet("walletconnect");
    }
  }
});

onUnmounted(() => {
  // Clean up Ethereum wallet store (event listeners)
  ethereumWalletStore.cleanup();
});
</script>
