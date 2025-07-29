import { defineStore } from "pinia"
import { computed, ref } from "vue"
import { BeaconWallet } from "@taquito/beacon-wallet"
import { TezosToolkit } from "@taquito/taquito"
import type { WalletProvider } from "@/types/wallet"
import { PermissionScopeMethods, WalletConnect } from '@taquito/wallet-connect'

export const useWalletStore = defineStore('wallet', () => {
	const Tezos = ref<TezosToolkit>(new TezosToolkit(import.meta.env.VITE_RPC_URL));

	const wallet = ref<BeaconWallet | WalletConnect>();
	const address = ref<string>();
	const balance = ref<BigNumber>();

	const getTezos = computed(() => Tezos.value);
	const getWallet = computed(() => wallet.value);
	const getAddress = computed(() => address.value);
	const getBalance = computed(() => balance.value);

	/**
	 * Initializes a wallet using the network configuration from environment variables.
	 * Requests wallet permissions and sets the wallet as the provider for the Tezos instance.
	 *
	 * @async
	 * @param {WalletProvider} provider The provider used to connect the wallet
	 * 
	 * @returns {Promise<void>} Resolves when the wallet is initialized and permissions are granted.
	 *
	 * @throws {ReferenceError} If a wallet is already initialized in this session.
	 * @throws {Error} If wallet initialization or permission request fails (e.g., user cancels the wallet popup).
	 */
	const initializeWallet = async (provider: WalletProvider): Promise<void> => {
		if (wallet.value) {
			console.error("Failed to initialize wallet due to a wallet already being initialized in this session.")
			throw new ReferenceError("Failed to initialize wallet: a wallet is already initialized.")
		}

		try {
			if (provider === 'beacon') {
				const options = {
					name: 'Taquito Playground',
					iconUrl: 'https://tezostaquito.io/img/favicon.svg',
					network: {
						type: import.meta.env.VITE_NETWORK_TYPE,
					},
					enableMetrics: true,
				};

				wallet.value = new BeaconWallet(options);
				await wallet.value.requestPermissions();
			} else if (provider === 'walletconnect') {
				wallet.value = await WalletConnect.init({
					projectId: import.meta.env.VITE_REOWN_PROJECT_ID,
					metadata: {
						name: "Taquito Playground",
						description: "Learning and examples for the Taquito project",
						icons: ['https://tezostaquito.io/img/favicon.svg'],
						url: "",
					},
				});

				if (!wallet.value) throw ReferenceError("Wallet not found after WalletConnect initialization should have finished.")

				await wallet.value.requestPermissions({
					permissionScope: {
						networks: [import.meta.env.VITE_NETWORK_TYPE],
						events: [],
						methods: [
							PermissionScopeMethods.TEZOS_SEND,
							PermissionScopeMethods.TEZOS_SIGN,
							PermissionScopeMethods.TEZOS_GET_ACCOUNTS
						],
					}
				});
			} else {
				throw new TypeError(`Unknown wallet provider: ${provider}`);
			}

			if (wallet.value) {
				address.value = await wallet.value.getPKH();
				await fetchBalance();
				Tezos.value.setProvider({ wallet: wallet.value });
			} else {
				throw ReferenceError("Wallet was not found after initialization should have finished.")
			}


		} catch (error) {
			console.error("Failed to initialize wallet or request permissions:", error);
			wallet.value = undefined;
			address.value = undefined;
			balance.value = undefined;
			throw error;
		}
	}

	/**
	 * Disconnects the currently connected wallet.
	 *
	 * This function clears the active account from the wallet client, disconnects the wallet,
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
			if (wallet.value instanceof BeaconWallet) {
				await wallet.value.client.clearActiveAccount();
			}

			// WalletConnect and Beacon share the same name for the disconnection
			await wallet.value.disconnect();

			wallet.value = undefined;
			address.value = undefined;
			balance.value = undefined;
		} catch (error) {
			console.error("Error disconnecting wallet:", error);
			throw error;
		}
	};

	/**
	 * Asynchronously fetches the balance for the current wallet address from the Tezos network and updates the `balance` state value.
	 *
	 * @throws {ReferenceError} If there is no saved address to fetch the balance for.
	 * @throws {Error} If an error occurs while fetching the balance from the Tezos network.
	 */
	const fetchBalance = async () => {
		if (!address.value) {
			console.log("Could not fetch balance as there is no saved address.")
			throw new ReferenceError("Could not fetch balance: no address")
		}

		try {
			balance.value = await Tezos.value.tz.getBalance(address.value);
		} catch (error) {
			console.error("Error fetching balance:", error);
			throw error;
		}
	}

	return {
		Tezos,
		getTezos,
		getAddress,
		getBalance,
		getWallet,
		initializeWallet,
		disconnectWallet,
		fetchBalance
	}
})