<template>
	<div class="bg-cyan-500 flex justify-between items-center">
		<RouterLink :to="{ name: 'home' }">Taquito Test dApp</RouterLink>
		<WalletControl />
	</div>
</template>

<script setup lang="ts">
import WalletControl from '@/components/wallet-control.vue';
</script>