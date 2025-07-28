<template>
	<div>
		<button @click="connectWallet()">Connect Wallet</button>
	</div>
</template>

<script setup lang="ts">
import wallet from '@/wallet';

const connectWallet = async () => {
	await wallet.initializeWallet();
}
</script>