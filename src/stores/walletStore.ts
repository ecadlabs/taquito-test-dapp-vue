import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { TezosToolkit } from "@taquito/taquito";
import { importKey, InMemorySigner } from "@taquito/signer";
import type { WalletProvider } from "@/types/wallet";
import { PermissionScopeMethods, WalletConnect } from "@taquito/wallet-connect";
import { NetworkType } from "@airgap/beacon-types";
import { NetworkType as WalletConnectNetworkType } from "@taquito/wallet-connect";
import { BeaconEvent } from "@airgap/beacon-dapp";
import { useSettingsStore } from "@/stores/settingsStore";

export const useWalletStore = defineStore("wallet", () => {
  const settingsStore = useSettingsStore();

  const Tezos = new TezosToolkit(settingsStore.settings.rpcUrl);

  const wallet = ref<BeaconWallet | WalletConnect>();
  const address = ref<string>();
  const balance = ref<BigNumber>();
  const walletName = ref<string>();

  const getTezos = computed(() => Tezos);
  const getWallet = computed(() => wallet.value);
  const getAddress = computed(() => address.value);
  const getBalance = computed(() => balance.value);
  const getWalletName = computed(() => walletName.value);

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
  const initializeWallet = async (
    provider: WalletProvider,
    privateKey?: string,
  ): Promise<void> => {
    console.log("Starting initialization of wallet using provider:", provider);
    try {
      // There is a wontfix issue in the Beacon SDK where no event is fired when the popup is closed,
      // resulting in a hanging promise, and causing the wallet state to never be cleared in our code.
      // If an event for this is added, we can properly handle the user closing the popup.
      // https://github.com/airgap-it/beacon-sdk/issues/905
      //
      // Until then, if the wallet variable has already been set by a previous session, we will reset the wallet state.
      // This should never be called unless the user wants to connect a new wallet, so this is safe.
      if (wallet.value) {
        wallet.value = undefined;
        address.value = undefined;
        balance.value = undefined;
        console.warn(
          "A wallet seems to already be initialized in this session. Resetting wallet state and assuming it is a new session.",
        );
      }

      if (provider === "beacon") {
        const options = {
          name: "Taquito Playground",
          iconUrl: "https://tezostaquito.io/img/favicon.svg",
          network: {
            type: NetworkType.CUSTOM,
            name: import.meta.env.VITE_NETWORK_TYPE,
            rpcUrl: settingsStore.settings.rpcUrl,
          },
          enableMetrics: true,
        };
        console.log("Using Beacon options object:", options);

        wallet.value = new BeaconWallet(options);

        wallet.value.client.subscribeToEvent(
          BeaconEvent.ACTIVE_ACCOUNT_SET,
          (account) => {
            // Beacon gets very upset if we don't subscribe to this event and do *something* with it
            if (account) {
              address.value = account.address;
            }
          },
        );

        const cachedAccount = await wallet.value.client.getActiveAccount();

        if (cachedAccount === undefined) {
          console.log(
            "No cached account found, requesting permissions from selected wallet.",
          );
          await wallet.value.requestPermissions();
        }

        // There must be a better way to do this
        try {
          const peers = await wallet.value.client.getPeers();
          walletName.value = peers[0].name;
        } catch {
          walletName.value = "unknown";
        }

        localStorage.setItem("wallet-provider", "beacon");
      } else if (provider === "walletconnect") {
        wallet.value = await WalletConnect.init({
          projectId: import.meta.env.VITE_REOWN_PROJECT_ID,
          metadata: {
            name: "Taquito Playground",
            description: "Learning and examples for the Taquito project",
            icons: ["https://tezostaquito.io/img/favicon.svg"],
            url: "",
          },
        });

        if (!wallet.value)
          throw ReferenceError(
            "Wallet not found after WalletConnect initialization should have finished.",
          );

        const latestSessionKey =
          await wallet.value.getAllExistingSessionKeys()?.[0];

        if (latestSessionKey) {
          await wallet.value.configureWithExistingSessionKey(latestSessionKey);
        } else {
          await wallet.value.requestPermissions({
            permissionScope: {
              networks: [WalletConnectNetworkType.SEOULNET],
              events: [],
              methods: [
                PermissionScopeMethods.TEZOS_SEND,
                PermissionScopeMethods.TEZOS_SIGN,
                PermissionScopeMethods.TEZOS_GET_ACCOUNTS,
              ],
            },
          });
        }

        localStorage.setItem("wallet-provider", "walletconnect");
      } else if (provider === "programmatic") {
        if (!privateKey) {
          throw new Error("No private key found");
        }

        await importKey(Tezos, privateKey);
        const importedAddress = await Tezos.signer.publicKeyHash();

        try {
          const signer = await InMemorySigner.fromSecretKey(privateKey);

          // Create a mock wallet object that implements the required interface
          // This will be replaced when the programmatic wallet package is fully implemented
          const mockWallet = {
            getPKH: async () => {
              return importedAddress;
            },
            requestPermissions: async () => Promise.resolve(),
            disconnect: async () => Promise.resolve(),
            client: {
              getActiveAccount: async () => ({
                address: importedAddress,
              }),
              getPeers: async () => [{ name: "Programmatic Wallet" }],
              disconnect: async () => Promise.resolve(),
              clearActiveAccount: async () => Promise.resolve(),
            },
            getAllExistingSessionKeys: async () => [],
            configureWithExistingSessionKey: async () => Promise.resolve(),
          };
          wallet.value = mockWallet as unknown as BeaconWallet;
          address.value = await mockWallet.getPKH();
          walletName.value = "Programmatic Wallet";
          Tezos.setProvider({ signer });
        } catch (error) {
          console.error("Failed to initialize programmatic wallet:", error);
          throw new Error(
            `Programmatic wallet initialization failed: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      } else {
        throw new TypeError(`Unknown wallet provider: ${provider}`);
      }

      if (wallet.value) {
        address.value = await wallet.value.getPKH();
        await fetchBalance();

        // Only set the wallet provider if we haven't already set a signer for programmatic wallet
        if (provider !== "programmatic") {
          Tezos.setProvider({ wallet: wallet.value });
        }
      } else {
        throw ReferenceError(
          "Wallet was not found after initialization should have finished.",
        );
      }
    } catch (error) {
      console.error(
        "Failed to initialize wallet or request permissions:",
        error,
      );
      wallet.value = undefined;
      address.value = undefined;
      balance.value = undefined;
      throw error;
    }
  };

  /**
   * Disconnects the currently connected wallet.
   *
   * This function disconnects the wallet, clears the active account from the wallet client,
   * and resets the wallet, address, and balance state to `undefined`.
   *
   * @throws {ReferenceError} If no wallet is currently connected.
   * @throws {Error} If an error occurs during disconnection.
   */
  const disconnectWallet = async () => {
    if (!wallet.value) {
      throw new ReferenceError(
        "Failed to disconnect wallet. No wallet currently connected",
      );
    }

    try {
      if (wallet.value instanceof BeaconWallet) {
        await wallet.value.client.disconnect();
        await wallet.value.client.clearActiveAccount();
      } else if (wallet.value instanceof WalletConnect) {
        await wallet.value.disconnect();
        await deleteWalletConnectSessionFromIndexedDB();
      }

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
      console.log("Could not fetch balance as there is no saved address.");
      throw new ReferenceError("Could not fetch balance: no address");
    }

    try {
      balance.value = await Tezos.tz.getBalance(address.value);
    } catch (error) {
      console.error("Error fetching balance:", error);
      throw error;
    }
  };

  /**
   * Performs an operation on the WalletConnect session stored in IndexedDB.
   *
   * This function opens the 'WALLET_CONNECT_V2_INDEXED_DB' IndexedDB database,
   * accesses the 'keyvaluestorage' object store, and searches for a key that starts with
   * 'wc@2:client:0.3:session'. If such a key is found, it executes the provided operation
   * callback on the object store and session key. The result of the operation is returned.
   * If the database, store, or key does not exist, or if any error occurs, it resolves to `undefined`.
   *
   * @param {'readonly' | 'readwrite'} mode - The transaction mode for the object store.
   * @param {(store: IDBObjectStore, sessionKey: string) => IDBRequest} operation - A callback that performs an IndexedDB operation using the object store and session key.
   * @returns {Promise<string | undefined>} The result of the operation if successful, otherwise `undefined`.
   */
  const walletConnectIndexedDBOperation = async (
    mode: "readonly" | "readwrite",
    operation: (store: IDBObjectStore, sessionKey: string) => IDBRequest,
  ): Promise<string | undefined> => {
    return new Promise((resolve) => {
      const request = indexedDB.open("WALLET_CONNECT_V2_INDEXED_DB");
      request.onerror = () => resolve(undefined);
      request.onsuccess = () => {
        try {
          const tx = request.result.transaction("keyvaluestorage", mode);
          const store = tx.objectStore("keyvaluestorage");
          const keysReq = store.getAllKeys();
          keysReq.onerror = () => resolve(undefined);
          keysReq.onsuccess = () => {
            const sessionKey = (keysReq.result as string[]).find((key) =>
              key.startsWith("wc@2:client:0.3:session"),
            );
            if (!sessionKey) return resolve(undefined);
            const sessionReq = operation(store, sessionKey);
            sessionReq.onerror = () => resolve(undefined);
            sessionReq.onsuccess = () =>
              resolve(sessionReq.result ?? undefined);
          };
        } catch {
          resolve(undefined);
        }
      };
    });
  };

  /**
   * Retrieves the WalletConnect session from IndexedDB if it exists.
   *
   * @returns {Promise<string | undefined>} The WalletConnect session data if found, otherwise `undefined`.
   */
  const getWalletConnectSessionFromIndexedDB = async (): Promise<
    string | undefined
  > => {
    return walletConnectIndexedDBOperation("readonly", (store, sessionKey) =>
      store.get(sessionKey),
    );
  };

  /**
   * Deletes the WalletConnect session from IndexedDB if it exists.
   *
   * @returns {Promise<string | undefined>} The result of the delete operation if successful, otherwise `undefined`.
   */
  const deleteWalletConnectSessionFromIndexedDB = async (): Promise<
    string | undefined
  > => {
    return walletConnectIndexedDBOperation("readwrite", (store, sessionKey) =>
      store.delete(sessionKey),
    );
  };

  return {
    Tezos,
    getTezos,
    getAddress,
    getBalance,
    getWallet,
    getWalletName,
    initializeWallet,
    disconnectWallet,
    fetchBalance,
    getWalletConnectSessionFromIndexedDB,
  };
});
