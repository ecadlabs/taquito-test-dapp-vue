<template>
	<div class="text-right">
		<button v-if="!address" @click="connect()">Connect Wallet</button>
		<button v-else @click="disconnect()">Disconnect Wallet</button>
		<p v-if="address" class="text-sm text-gray-300">{{ address }}</p>
		<p v-if="balance" class="text-sm text-orange-300">{{ `${balance.toNumber() / 1000000} ꜩ` }}</p>
	</div>
</template>

<script setup lang="ts">
import { useWalletStore } from '@/stores/walletStore';
import { computed } from 'vue';

const walletStore = useWalletStore();

const address = computed(() => walletStore.getAddress)
const balance = computed(() => walletStore.getBalance)

const connect = async () => {
	await walletStore.initializeWallet();
}

const disconnect = async () => {
	await walletStore.disconnectWallet();
}
</script>