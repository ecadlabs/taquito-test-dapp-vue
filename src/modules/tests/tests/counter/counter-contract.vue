<template>
	<div>
		<p>This is a contract incrementation and decrementation test component</p>
		<div>
			<input type="number" v-model="amount">
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

// TODO: Set limits on the amount
const amount = ref<number>(0);
</script>
