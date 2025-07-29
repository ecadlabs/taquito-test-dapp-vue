import { defineStore } from "pinia"
import { computed, ref } from "vue"
import { BeaconWallet } from "@taquito/beacon-wallet"
import { TezosToolkit } from "@taquito/taquito"

export const useWalletStore = defineStore('wallet', () => {
	const Tezos = ref<TezosToolkit>(new TezosToolkit(import.meta.env.VITE_RPC_URL));

	const wallet = ref<BeaconWallet>();
	const address = ref<string>();
	const balance = ref<number>();

	const getTezos = computed(() => Tezos);
	const getWallet = computed(() => wallet.value);
	const getAddress = computed(() => address.value);
	const getBalance = computed(() => balance.value);

	/**
	 * Initializes the BeaconWallet using the network configuration from environment variables.
	 * Requests wallet permissions and sets the wallet as the provider for the Tezos instance.
	 *
	 * @async
	 * @returns {Promise<void>} Resolves when the wallet is initialized and permissions are granted.
	 *
	 * @throws {ReferenceError} If a wallet is already initialized in this session.
	 * @throws {Error} If wallet initialization or permission request fails (e.g., user cancels the wallet popup).
	 */
	const initializeWallet = async (): Promise<void> => {
		if (wallet.value) {
			console.error("Failed to initialize wallet due to a wallet already being initialized in this session.")
			throw new ReferenceError("Failed to initialize wallet: a wallet is already initialized.")
		}

		try {
			const options = {
				name: 'Taquito Playground',
				iconUrl: 'https://tezostaquito.io/img/favicon.svg',
				network: {
					type: import.meta.env.VITE_NETWORK_TYPE,
				},
			};

			wallet.value = new BeaconWallet(options);
			await wallet.value.requestPermissions();
			address.value = await wallet.value.getPKH();
			Tezos.value.setWalletProvider(wallet.value);
			console.log("Wallet connection successful:", wallet.value)
		} catch (error) {
			console.error("Failed to initialize wallet or request permissions:", error);
			throw error;
		}
	}

	/**
	 * Disconnects the currently connected wallet.
	 *
	 * This function clears the active account from the wallet client
	 * and resets the wallet, address, and balance state to `undefined`.
	 *
	 * @throws {ReferenceError} If no wallet is currently connected.
	 * @throws {Error} If an error occurs during disconnection.
	 */
	const disconnectWallet = async () => {
		if (!wallet.value) {
			throw new ReferenceError('Failed to disconnect wallet. No wallet currently connected');
		}

		try {
			await wallet.value.client.clearActiveAccount();
			wallet.value = undefined;
			address.value = undefined;
			balance.value = undefined;
			console.log("Wallet disconnected successfully");
		} catch (error) {
			console.error("Error disconnecting wallet:", error);
			throw error;
		}
	};

	return {
		getTezos,
		getAddress,
		getBalance,
		getWallet,
		initializeWallet,
		disconnectWallet
	}
})