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

  <!-- Global Test Dialog -->
  <TestDialog />

  <!-- Global Command Palette -->
  <CommandMenu />
</template>

<script setup lang="ts">
import CommandMenu from "@/components/command-menu.vue";
import HeaderComponent from "@/components/header-component.vue";
import TestDialog from "@/components/test-dialog.vue";
import { Toaster } from "@/components/ui/sonner";
import { useFavicon } from "@/composables/useFavicon";
import { useWalletStore } from "@/stores/walletStore";
import { onMounted } from "vue";
import "vue-sonner/style.css";

const walletStore = useWalletStore();

useFavicon();

onMounted(async () => {
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
</script>
