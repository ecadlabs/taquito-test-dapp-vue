<template>
	<div>
		<div>
			<div v-if="!address" class="flex items-center gap-2">
				<div class="size-3 rounded-full bg-red-400" />
				<p class="sr-only">Wallet Disconnected</p>
				<Button variant="outline" @click="showConnectDialog = true">
					Connect Wallet
				</Button>
			</div>
			<div v-else class="flex items-center gap-2">
				<div class="size-3 rounded-full bg-green-400" />
				<p class="sr-only">Wallet Connected</p>
				<Button variant="outline" @click="showDisconnectDialog = true">
					Disconnect Wallet
				</Button>
			</div>
		</div>
	</div>

	<!-- Connection Dialog -->
	<Dialog :open="showConnectDialog" @update:open="showConnectDialog = $event">
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Connect Wallet</DialogTitle>
				<DialogDescription>
					<div class="flex items-center space-x-1 flex-wrap">
						<span>Taquito Playground supports both</span>
						<a href="https://www.walletbeacon.io/" target="_blank"
							class="text-blue-400 hover:underline">Beacon</a>
						<span>and</span>
						<a href="https://walletconnect.network/" target="_blank"
							class="text-blue-400 hover:underline">WalletConnect.</a>
						<p>Select your preference and hit connect to get started.</p>
					</div>
				</DialogDescription>
			</DialogHeader>

			<div>
				<Select v-model="provider">
					<SelectTrigger class="w-[150px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="beacon">
							Beacon
						</SelectItem>
						<SelectItem value="walletconnect">
							WalletConnect
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<DialogFooter>
				<Button variant="secondary" @click="connect()" :disabled="loading || !provider">
					<Loader2 v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
					<p>Connect</p>
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>

	<!-- Disconnection Dialog -->
	<Dialog :open="showDisconnectDialog" @update:open="showDisconnectDialog = $event">
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Disconnect Wallet</DialogTitle>
				<DialogDescription>
					<p>Are you sure you want to disconnect your wallet?</p>
				</DialogDescription>
			</DialogHeader>

			<DialogFooter>
				<Button variant="destructive" @click="disconnect()" :disabled="loading">
					<Loader2 v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
					<p>Disconnect</p>
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>

	<!-- <button v-if="!address" @click="connect()" :disabled="connecting">
			<p v-if="connecting">Loading...</p>
			<p v-else>Connect Wallet</p>
		</button>
		<button v-else @click="disconnect()">
			Disconnect Wallet
		</button>
		<p v-if="address" class="text-sm text-gray-300">
			{{ address }}
		</p>
		<p v-if="balance" class="text-sm text-orange-300">
			{{ `${balance.toNumber() / 1000000} ꜩ` }}
		</p> -->
</template>

<script setup lang="ts">
import { useWalletStore } from '@/stores/walletStore';
import { computed, ref, watch } from 'vue';
import type { WalletProvider } from '@/types/wallet';
import { Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { toast } from 'vue-sonner';

const walletStore = useWalletStore();

const address = computed(() => walletStore.getAddress)
const balance = computed(() => walletStore.getBalance)

const provider = ref<WalletProvider>('beacon')
const loading = ref<boolean>(false);
const showConnectDialog = ref<boolean>(false);
const showDisconnectDialog = ref<boolean>(false);

watch([showConnectDialog, showDisconnectDialog], ([newValue]) => { if (newValue === false) { loading.value = false } })

const connect = async () => {
	try {
		loading.value = true;
		await walletStore.initializeWallet(provider.value);
		toast.success('Wallet connected');
	} catch (error) {
		toast.error('Wallet connection failed', {
			description: error instanceof Error ? error.message : String(error),
		})
	} finally {
		showConnectDialog.value = false;
		loading.value = false;
	}
}

const disconnect = async () => {
	try {
		loading.value = true;
		await walletStore.disconnectWallet();
		toast.success('Wallet disconnected');
	} catch (error) {
		toast.error('Wallet disconnection failed', {
			description: error instanceof Error ? error.message : String(error),
		})
	} finally {
		showDisconnectDialog.value = false;
		loading.value = false;
	}
}
</script>