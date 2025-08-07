<template>
	<div class="flex items-center w-full justify-center gap-4">
		<Button @click="decrementCounter()">
			<Minus class="size-6" />
		</Button>
		<div class="flex flex-col items-center gap-2">
			<Button variant="ghost" @click="getStorageValue()">
				<RefreshCw class="size-4" />
			</Button>
			<p class="text-5xl font-bold">{{ storageValue ?? '...' }}</p>
			<p class="text-sm text-muted-foreground">Storage Value</p>
			<Button variant="ghost" @click="resetCounter()">
				<Trash class="size-4" />
			</Button>
		</div>
		<Button @click="incrementCounter()">
			<Plus class="size-6" />
		</Button>
	</div>
</template>

<script setup lang='ts'>
import { useDiagramStore } from '@/stores/diagramStore';
import Button from '@/components/ui/button/Button.vue';
import { increment, decrement, reset, getContractStorage } from '@/modules/tests/tests/counter/counter-contract';
import { onMounted, ref } from 'vue';
import { Minus, Plus, RefreshCw, Trash } from 'lucide-vue-next';

const diagramStore = useDiagramStore();

const storageValue = ref<number>();

onMounted(() => {
	diagramStore.setTestDiagram('counter-contract');
});

const getStorageValue = async () => {
	storageValue.value = await getContractStorage();
}

const incrementCounter = async () => {
	storageValue.value = await increment(1);
}

const decrementCounter = async () => {
	storageValue.value = await decrement(1);
}

const resetCounter = async () => {
	try {
		await reset();
		storageValue.value = 0;
	} catch (error) {
		console.error(error);
	}
}
</script>
