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
  const provider = localStorage.getItem('wallet-provider');

  // This if statement should be replaced with some sort of TypeScript implementation of LocalStorage
  if (provider === 'beacon') {
    walletStore.initializeWallet('beacon')
  } else {
    //
  }


})
</script>