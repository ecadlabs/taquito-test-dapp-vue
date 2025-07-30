<template>
	<div>
		<p>This is a contract incrementation and decrementation test component</p>
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
		<Button @click="getContractStorage()">Get storage value</Button>
		<Button @click="getContractMethods()">Get methods</Button>
		<Button @click="increment(amount)">Increment</Button>
		<Button @click="decrement(amount)">Decrement</Button>
		<Button @click="reset()">Reset storage</Button>

	</div>
</template>

<script setup lang='ts'>
import Button from '@/components/ui/button/Button.vue';
import { increment, decrement, reset, getContractStorage, getContractMethods } from '@/modules/tests/tests/counter/counter-contract';
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
