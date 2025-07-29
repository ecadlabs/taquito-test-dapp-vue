<template>
	<div class="text-right">
		<button v-if="!address" @click="connect()">Connect Wallet</button>
		<button v-else @click="disconnect()">Disconnect Wallet</button>
		<p v-if="address" class="text-sm text-gray-300">{{ address }}</p>
	</div>
</template>

<script setup lang="ts">
import { useWalletStore } from '@/stores/walletStore';
import { computed } from 'vue';

const walletStore = useWalletStore();

const address = computed(() => walletStore.getAddress)

const connect = async () => {
	await walletStore.initializeWallet();
}

const disconnect = async () => {
	await walletStore.disconnectWallet();
}
</script>