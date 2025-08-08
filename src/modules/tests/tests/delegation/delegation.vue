<template>
	<div class="w-full flex flex-col items-center gap-4">
		<div>
			<Label class="mb-1">Delegate To</Label>
			<Input placeholder="Delegate to address..." v-model="toAddress" class="w-48" />
		</div>
		<Button @click="delegateToCurrentAddress()" :disabled="sending">
			<Loader2 v-if="sending" class="w-4 h-4 mr-2 animate-spin" />
			<p v-else>Delegate</p>
		</Button>
		<Button @click="removeDelegation()" :disabled="sending">
			<Loader2 v-if="sending" class="w-4 h-4 mr-2 animate-spin" />
			<p v-else>Undelegate</p>
		</Button>
	</div>
</template>

<script setup lang='ts'>
import { useDiagramStore } from '@/stores/diagramStore';
import { ref, onMounted } from 'vue';
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-vue-next';
import { delegate, undelegate } from '@/modules/tests/tests/delegation/delegation';

const toAddress = ref<string>('tz1cjyja1TU6fiyiFav3mFAdnDsCReJ12hPD')
const sending = ref<boolean>(false);
const diagramStore = useDiagramStore();

onMounted(() => {
	diagramStore.setTestDiagram('delegation');
});

const delegateToCurrentAddress = async () => {
	try {
		sending.value = true;
		await delegate(toAddress.value);
	} catch (error) {
		console.error(error);
	} finally {
		sending.value = false;
	}
}

const removeDelegation = async () => {
	try {
		sending.value = true;
		await undelegate();
	} catch (error) {
		console.error(error);
	} finally {
		sending.value = false;
	}
}
</script>
