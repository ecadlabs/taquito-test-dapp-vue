<template>
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
</template>

<script setup lang="ts">
import CommandMenu from "@/components/command-menu.vue";
import HeaderComponent from "@/components/header-component.vue";
import { Toaster } from "@/components/ui/sonner";
import { useFavicon } from "@/composables/useFavicon";
import { useTheme } from "@/composables/useTheme";
import { web3AuthService } from "@/services/web3AuthService";
import { useEthereumWalletStore } from "@/stores/ethereumWalletStore";
import { useWalletStore } from "@/stores/walletStore";
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
  } else if (provider === "web3auth") {
    // Restore Web3Auth session if the user was previously connected
    try {
      await web3AuthService.initialize();
      if (web3AuthService.isConnected()) {
        await walletStore.initializeWallet("web3auth");
      }
    } catch (error) {
      console.error("Failed to restore Web3Auth session:", error);
      localStorage.removeItem("wallet-provider");
    }
  }
});

onUnmounted(() => {
  // Clean up Ethereum wallet store (event listeners)
  ethereumWalletStore.cleanup();
});
</script>
