<template>
	<div class="w-full flex flex-col items-center gap-6 px-6">
		<!-- Current delegate section -->
		<div v-if="currentDelegate" class="w-full max-w-md">
			<div>
				<div class="flex items-center gap-3 mb-4">
					<CheckCircle class="w-6 h-6 text-green-500" />
					<h3 class="text-lg font-semibold">Current Delegate</h3>
				</div>
				<div class="bg-background rounded-md p-3 border">
					<p class="font-mono text-sm break-all">{{ currentDelegate }}</p>
				</div>
				<Button @click="removeDelegation()" :disabled="sending" variant="destructive" class="w-full mt-4">
					<Loader2 v-if="sending" class="w-4 h-4 mr-2 animate-spin" />
					<Unlink v-else class="w-4 h-4 mr-2" />
					<span v-if="!sending" class="font-semibold">Remove Delegation</span>
					<span v-else>Removing...</span>
				</Button>
			</div>
		</div>

		<!-- Delegate to new address section -->
		<div v-else class="w-full max-w-md">
			<div>
				<div class="flex items-center gap-1.5 mb-4">
					<Cookie class="w-6 h-6" />
					<h3 class="text-lg font-semibold">Delegate to Baker</h3>
				</div>
				<div class="space-y-4">
					<div>
						<Label class="text-sm font-medium mb-2 block">Delegate Address</Label>
						<Input placeholder="Enter delegate address..." v-model="toAddress"
							class="w-full font-mono text-sm" />
					</div>
					<Button @click="delegateToCurrentAddress()" :disabled="sending" class="w-full">
						<Loader2 v-if="sending" class="w-4 h-4 mr-2 animate-spin" />
						<Cookie v-else class="w-4 h-4" />
						<span v-if="!sending" class="font-semibold">Delegate</span>
						<span v-else>Delegating...</span>
					</Button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang='ts'>
import { useDiagramStore } from '@/stores/diagramStore';
import { ref, onMounted } from 'vue';
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle, Unlink, Cookie } from 'lucide-vue-next';
import { delegate, getDelegate, undelegate } from '@/modules/tests/tests/delegation/delegation';
import { useWalletStore } from '@/stores/walletStore';

const diagramStore = useDiagramStore();
const walletStore = useWalletStore();

const toAddress = ref<string>('tz1cjyja1TU6fiyiFav3mFAdnDsCReJ12hPD')
const sending = ref<boolean>(false);
const currentDelegate = ref<string | null>();

onMounted(async () => {
	diagramStore.setTestDiagram('delegation');
	currentDelegate.value = await getCurrentDelegate();
});

const delegateToCurrentAddress = async () => {
	try {
		sending.value = true;
		await delegate(toAddress.value);
		currentDelegate.value = toAddress.value;
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
		currentDelegate.value = undefined;
	} catch (error) {
		console.error(error);
	} finally {
		sending.value = false;
	}
}

const getCurrentDelegate = async () => {
	if (!walletStore.getAddress) {
		throw new Error('No current address found');
	}

	return await getDelegate(walletStore.getAddress);
}
</script>
