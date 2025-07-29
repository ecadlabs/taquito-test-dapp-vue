<template>
  <div class="bg-gray-500 flex justify-between items-center p-3 text-white">
    <RouterLink :to="{ name: 'home' }">
      Taquito Playground
    </RouterLink>
    <WalletControl />
  </div>
</template>

<script setup lang="ts">
import WalletControl from '@/components/wallet-control.vue';
</script>