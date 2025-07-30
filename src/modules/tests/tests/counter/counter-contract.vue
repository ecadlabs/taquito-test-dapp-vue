<template>
	<div class="flex flex-col items-center gap-4">
		<div>
			<NumberField :min="1" :max="100" class="w-28">
				<Label>Amount</Label>
				<NumberFieldContent>
					<NumberFieldDecrement />
					<NumberFieldInput v-model="amount" />
					<NumberFieldIncrement />
				</NumberFieldContent>
			</NumberField>
		</div>
		<div class="flex gap-2">
			<Button @click="getContractStorage()">Get Storage Value</Button>
			<Button @click="decrement(amount)">Decrement Storage</Button>
			<Button @click="increment(amount)">Increment Storage</Button>
			<Button @click="reset()">Reset Storage</Button>
		</div>


	</div>
</template>

<script setup lang='ts'>
import Button from '@/components/ui/button/Button.vue';
import { increment, decrement, reset, getContractStorage } from '@/modules/tests/tests/counter/counter-contract';
import { ref } from 'vue';

import { Label } from '@/components/ui/label'
import {
	NumberField,
	NumberFieldContent,
	NumberFieldDecrement,
	NumberFieldIncrement,
	NumberFieldInput,
} from '@/components/ui/number-field'

const amount = ref<number>(0);
</script>
