import { useSettingsStore } from "@/stores/settingsStore";
import type { ProgrammaticWallet, WalletProvider } from "@/types/wallet";
import { BeaconEvent } from "@airgap/beacon-dapp";
import { NetworkType } from "@airgap/beacon-types";
import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { LedgerSigner } from "@taquito/ledger-signer";
import { importKey, InMemorySigner } from "@taquito/signer";
import { TezosToolkit } from "@taquito/taquito";
import {
  PermissionScopeMethods,
  WalletConnect,
  NetworkType as WalletConnectNetworkType,
} from "@taquito/wallet-connect";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useWalletStore = defineStore("wallet", () => {
  const settingsStore = useSettingsStore();

  const Tezos = new TezosToolkit(settingsStore.settings.rpcUrl);

  const wallet = ref<
    BeaconWallet | WalletConnect | LedgerSigner | ProgrammaticWallet
  >();
  const address = ref<string>();
  const balance = ref<BigNumber>();
  const walletName = ref<string>();

  const getTezos = computed(() => Tezos);
  const getWallet = computed(() => wallet.value);
  const getAddress = computed(() => address.value);

  /** Gets the address from the current wallet */
  const getWalletAddress = async (): Promise<string | undefined> => {
    if (!wallet.value) return undefined;

    try {
      if (wallet.value instanceof BeaconWallet) {
        const activeAccount = await wallet.value.client.getActiveAccount();
        return activeAccount?.address;
      } else if (wallet.value instanceof WalletConnect) {
        return await wallet.value.getPKH();
      } else if (wallet.value instanceof LedgerSigner) {
        return await wallet.value.publicKeyHash();
      } else {
        // Programmatic wallet
        return await wallet.value.getPKH();
      }
    } catch (error) {
      console.error("Error getting address:", error);
      return undefined;
    }
  };

  /** Gets the public key from the current wallet */
  const getWalletPublicKey = async (): Promise<string | undefined> => {
    if (!wallet.value) return undefined;

    try {
      if (wallet.value instanceof LedgerSigner) {
        return await wallet.value.publicKey();
      } else {
        return await wallet.value.getPK();
      }
    } catch (error) {
      console.error("Error getting public key:", error);
      return undefined;
    }
  };
  const getBalance = computed(() => balance.value);
  const getWalletName = computed(() => walletName.value);

  /** Resets all wallet state variables to undefined and clears the local storage */
  const resetWalletState = (): void => {
    wallet.value = undefined;
    address.value = undefined;
    balance.value = undefined;
    walletName.value = undefined;

    // Clear any persisted wallet state
    localStorage.removeItem("wallet-provider");

    // Reset Tezos provider to clear any configured signers/wallets
    // and recreate a fresh instance to fully clear any imported keys.
    // This is necessary because importKey() persists keys in the toolkit instance.
    const freshTezos = new TezosToolkit(settingsStore.settings.rpcUrl);
    Object.assign(Tezos, freshTezos);
  };

  /** Initializes a Beacon wallet */
  const initializeBeaconWallet = async (): Promise<void> => {
    const networkType =
      import.meta.env.VITE_NETWORK_TYPE === "seoulnet"
        ? NetworkType.CUSTOM
        : (import.meta.env.VITE_NETWORK_TYPE as NetworkType);

    const options = {
      name: "Taquito Playground",
      iconUrl: "https://tezostaquito.io/img/favicon.svg",
      network: {
        type: networkType,
        name: import.meta.env.VITE_NETWORK_TYPE,
        rpcUrl: settingsStore.settings.rpcUrl,
      },
      enableMetrics: true,
    };

    const beaconWallet = new BeaconWallet(options);
    beaconWallet.client.subscribeToEvent(
      BeaconEvent.ACTIVE_ACCOUNT_SET,
      (account) => {
        // Beacon gets very upset if we don't subscribe to this event and do *something* with it
        if (account) {
          address.value = account.address;
        }
      },
    );

    const cachedAccount = await beaconWallet.client.getActiveAccount();

    if (cachedAccount === undefined) {
      console.log(
        "No cached account found, requesting permissions from selected wallet.",
      );
      await beaconWallet.requestPermissions();
    }

    // There must be a better way to do this
    try {
      const peers = await beaconWallet.client.getPeers();
      walletName.value = peers[0].name;
    } catch {
      walletName.value = "unknown";
    }

    wallet.value = beaconWallet;
    Tezos.setProvider({ wallet: beaconWallet });

    localStorage.setItem("wallet-provider", "beacon");
  };

  /** Initializes a WalletConnect wallet */
  const initializeWalletConnect = async (): Promise<void> => {
    const walletConnect = await WalletConnect.init({
      projectId: import.meta.env.VITE_REOWN_PROJECT_ID,
      metadata: {
        name: "Taquito Playground",
        description: "Learning and examples for the Taquito project",
        icons: ["https://tezostaquito.io/img/favicon.svg"],
        url: "",
      },
    });

    if (!walletConnect)
      throw ReferenceError(
        "Wallet not found after WalletConnect initialization should have finished.",
      );

    const latestSessionKey =
      await walletConnect.getAllExistingSessionKeys()?.[0];

    if (latestSessionKey) {
      await walletConnect.configureWithExistingSessionKey(latestSessionKey);
    } else {
      await walletConnect.requestPermissions({
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

    wallet.value = walletConnect;
    localStorage.setItem("wallet-provider", "walletconnect");
  };

  /** Initializes a programmatic wallet using a private key */
  const initializeProgrammaticWallet = async (
    privateKey: string,
  ): Promise<void> => {
    if (!privateKey) {
      throw new Error("No private key found");
    }

    await importKey(Tezos, privateKey);
    const importedAddress = await Tezos.signer.publicKeyHash();

    try {
      const signer = await InMemorySigner.fromSecretKey(privateKey);

      // Create a mock wallet object that implements the required interface
      // This will be replaced when the programmatic wallet package is fully implemented
      const mockWallet: ProgrammaticWallet = {
        getPKH: async () => {
          return importedAddress;
        },
        getPK: async () => {
          return Tezos.signer.publicKey();
        },
        requestPermissions: async () => Promise.resolve(),
        disconnect: async () => Promise.resolve(),
        client: {
          getActiveAccount: async () => ({
            address: importedAddress,
          }),
          getPeers: async () => [{ name: "Raw Private Key Access" }],
          disconnect: async () => Promise.resolve(),
          clearActiveAccount: async () => Promise.resolve(),
        },
        getAllExistingSessionKeys: async () => [],
        configureWithExistingSessionKey: async () => Promise.resolve(),
      };
      wallet.value = mockWallet;
      address.value = await mockWallet.getPKH();
      walletName.value = "Raw Private Key Access";
      Tezos.setProvider({ signer });
    } catch (error) {
      console.error("Failed to initialize programmatic wallet:", error);
      throw new Error(
        `Programmatic wallet initialization failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  /** Initializes a Ledger hardware wallet */
  const initializeLedgerWallet = async (): Promise<void> => {
    const transport = await TransportWebHID.create();
    const ledgerSigner = new LedgerSigner(transport);

    Tezos.setProvider({ signer: ledgerSigner });
    wallet.value = ledgerSigner;
    walletName.value = "Ledger Device";
    localStorage.setItem("wallet-provider", "ledger");
  };

  /**
   * Initializes a wallet using the network configuration from environment
   * variables. Requests wallet permissions and sets the wallet as the provider
   * for the Tezos instance.
   *
   * @async
   * @param {WalletProvider} provider The provider used to connect the wallet
   * @returns {Promise<void>} Resolves when the wallet is initialized and
   *   permissions are granted.
   * @throws {ReferenceError} If a wallet is already initialized in this
   *   session.
   * @throws {Error} If wallet initialization or permission request fails (e.g.,
   *   user cancels the wallet popup).
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
        resetWalletState();
        console.warn(
          "A wallet seems to already be initialized in this session. Resetting wallet state and assuming it is a new session.",
        );
      }

      // Initialize wallet based on provider
      switch (provider) {
        case "beacon":
          await initializeBeaconWallet();
          break;
        case "walletconnect":
          await initializeWalletConnect();
          break;
        case "programmatic":
          if (!privateKey) {
            throw new Error("No private key found for programmatic wallet");
          }
          await initializeProgrammaticWallet(privateKey);
          break;
        case "ledger":
          await initializeLedgerWallet();
          break;
        default:
          throw new TypeError(`Unknown wallet provider: ${provider}`);
      }

      if (wallet.value) {
        // Only set the wallet provider if we haven't already set a signer for programmatic wallet
        // Note: Beacon wallet is already set as provider in initializeBeaconWallet
        if (provider === "walletconnect") {
          Tezos.setProvider({
            wallet: wallet.value as WalletConnect,
          });
        }

        // Get the address using the wallet address function
        const walletAddress = await getWalletAddress();
        if (walletAddress) {
          address.value = walletAddress;
        } else {
          throw new Error("Could not retrieve address from wallet");
        }

        await fetchBalance();
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
      resetWalletState();
      throw error;
    }
  };

  /**
   * Disconnects the currently connected wallet.
   *
   * This function disconnects the wallet, clears the active account from the
   * wallet client, and resets the wallet, address, and balance state to
   * `undefined`.
   *
   * @throws {ReferenceError} If no wallet is currently connected.
   * @throws {Error} If an error occurs during disconnection.
   */
  const disconnectWallet = async () => {
    try {
      if (!wallet.value) {
        throw new ReferenceError(
          "Failed to disconnect wallet. No wallet currently connected",
        );
      }

      if (wallet.value instanceof BeaconWallet) {
        await wallet.value.client.disconnect();
        await wallet.value.client.clearActiveAccount();
      } else if (wallet.value instanceof WalletConnect) {
        await wallet.value.disconnect();
        await deleteWalletConnectSessionFromIndexedDB();
      } else if (wallet.value instanceof LedgerSigner) {
        // Ledger doesn't need explicit disconnection
      }

      // Reset wallet state after disconnection
      resetWalletState();
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      // Still reset state even if disconnection fails
      resetWalletState();
      throw error;
    }
  };

  /**
   * Asynchronously fetches the balance for the current wallet address from the
   * Tezos network and updates the `balance` state value.
   *
   * @throws {ReferenceError} If there is no saved address to fetch the balance
   *   for.
   * @throws {Error} If an error occurs while fetching the balance from the
   *   Tezos network.
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
   * accesses the 'keyvaluestorage' object store, and searches for a key that
   * starts with 'wc@2:client:0.3:session'. If such a key is found, it executes
   * the provided operation callback on the object store and session key. The
   * result of the operation is returned. If the database, store, or key does
   * not exist, or if any error occurs, it resolves to `undefined`.
   *
   * @param {"readonly" | "readwrite"} mode - The transaction mode for the
   *   object store.
   * @param {(store: IDBObjectStore, sessionKey: string) => IDBRequest} operation
   *   - A callback that performs an IndexedDB operation using the object store and
   *       session key.
   *
   * @returns {Promise<string | undefined>} The result of the operation if
   *   successful, otherwise `undefined`.
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
   * @returns {Promise<string | undefined>} The WalletConnect session data if
   *   found, otherwise `undefined`.
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
   * @returns {Promise<string | undefined>} The result of the delete operation
   *   if successful, otherwise `undefined`.
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
    getWalletAddress,
    getWalletPublicKey,
  };
});
