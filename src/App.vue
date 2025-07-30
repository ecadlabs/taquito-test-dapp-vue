<template>
  <Toaster />

  <div id="app">
    <HeaderComponent />
    <router-view />
  </div>
</template>

<script setup lang="ts">
import 'vue-sonner/style.css'

import HeaderComponent from '@/components/header-component.vue';

import { Toaster } from '@/components/ui/sonner'
import { onMounted } from 'vue';
import { useWalletStore } from '@/stores/walletStore';

const walletStore = useWalletStore();

onMounted(async () => {
  // We check what the last provider they used was, then also check if they still have a saved session with that provider.
  // If they do, we can re-initialize the session without showing the wallet authentication flow.
  const provider = localStorage.getItem('wallet-provider');

  if (provider === 'beacon') {
    const beaconActiveAccount = localStorage.getItem('beacon:active-account');
    if (beaconActiveAccount !== 'undefined') {
      walletStore.initializeWallet('beacon');
    }
  } else if (provider === 'walletconnect') {
    // TODO: pass a disabled state to the connect button while this is loading
    const walletConnectActiveSession = await walletStore.getWalletConnectSessionFromIndexedDB();
    if (walletConnectActiveSession !== undefined) {
      walletStore.initializeWallet('walletconnect');
    }

  }
})
</script>