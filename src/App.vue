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

onMounted(() => {
  const beaconActiveAccount = localStorage.getItem('beacon:active-account');
  if (beaconActiveAccount !== 'undefined') {
    walletStore.initializeWallet('beacon')
  }
})
</script>