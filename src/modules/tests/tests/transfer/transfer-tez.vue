<template>
	<div>
		<p>This is a transfer test component</p>
		<div>
			<input type="text" v-model="toAddress" placeholder="Address...">
			<input type="number" v-model="amount" placeholder="Amount...">
		</div>
		<button @click="sendTransfer()">Send!</button>
	</div>
</template>

<script setup lang='ts'>
import { ref } from 'vue';
import { send } from '@/modules/tests/tests/transfer/transfer-tez';

const toAddress = ref<string>()
const amount = ref<number>(0)

const sendTransfer = async () => {
	if (!toAddress.value) return;

	await send(toAddress.value, amount.value)
}
</script>
