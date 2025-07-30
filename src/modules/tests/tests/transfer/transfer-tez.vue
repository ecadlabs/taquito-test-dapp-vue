<template>
	<div class="w-full flex flex-col items-center gap-4">
		<div>
			<Label class="mb-1">Wallet Address</Label>
			<Input placeholder="Wallet address..." v-model="toAddress" class="w-48" />
		</div>

		<div>
			<NumberField :min="1" :max="100" v-model="amount">
				<Label>Amount</Label>
				<NumberFieldContent class="w-48">
					<NumberFieldDecrement />
					<NumberFieldInput />
					<NumberFieldIncrement />
				</NumberFieldContent>
			</NumberField>
		</div>
		<Button @click="sendTransfer()" :disabled="sending" class="w-32">
			<Loader2 v-if="sending" class="w-4 h-4 mr-2 animate-spin" />
			<p v-else>Send Transfer</p>
		</Button>
	</div>
</template>

<script setup lang='ts'>
import { ref } from 'vue';
import { send } from '@/modules/tests/tests/transfer/transfer-tez';
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label'
import {
	NumberField,
	NumberFieldContent,
	NumberFieldDecrement,
	NumberFieldIncrement,
	NumberFieldInput,
} from '@/components/ui/number-field'
import { Loader2 } from 'lucide-vue-next';

const toAddress = ref<string>('tz1h3rQ8wBxFd8L9B3d7Jhaawu6Z568XU3xY')
const amount = ref<number>(1);

const sending = ref<boolean>(false);

const sendTransfer = async () => {
	if (!toAddress.value) return;

	try {
		sending.value = true;
		await send(toAddress.value, amount.value);
	} catch (error) {
		console.error(error);
		// TODO: show error in operational flow, or a toast
	} finally {
		sending.value = false;
	}
}
</script>
