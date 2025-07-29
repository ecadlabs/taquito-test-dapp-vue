<template>
	<div class="text-right">
		<select id="wallet-provider" v-model="provider" name="provider" class="mr-4 px-2 py-1 rounded-md bg-gray-400">
			<option value="beacon">
				Beacon
			</option>
			<option value="walletconnect">
				WalletConnect
			</option>
		</select>
		<button v-if="!address" @click="connect()">
			Connect Wallet
		</button>
		<button v-else @click="disconnect()">
			Disconnect Wallet
		</button>
		<p v-if="address" class="text-sm text-gray-300">
			{{ address }}
		</p>
		<p v-if="balance" class="text-sm text-orange-300">
			{{ `${balance.toNumber() / 1000000} ꜩ` }}
		</p>
	</div>
</template>

<script setup lang="ts">
import { useWalletStore } from '@/stores/walletStore';
import { computed, ref } from 'vue';
import type { WalletProvider } from '@/types/wallet';

const walletStore = useWalletStore();

const address = computed(() => walletStore.getAddress)
const balance = computed(() => walletStore.getBalance)

const provider = ref<WalletProvider>('beacon')

const connect = async () => {
	await walletStore.initializeWallet(provider.value);
}

const disconnect = async () => {
	await walletStore.disconnectWallet();
}
</script>