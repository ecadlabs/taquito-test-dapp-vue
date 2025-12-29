import {
  initializeBeaconEvents,
  initializeWalletConnectEvents,
} from "@/lib/walletEvents";
import { web3AuthService } from "@/services/web3AuthService";
import { useSettingsStore } from "@/stores/settingsStore";
import type { ProgrammaticWallet, WalletProvider } from "@/types/wallet";
import { NetworkType, type ExtendedPeerInfo } from "@airgap/beacon-types";
import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import * as Sentry from "@sentry/vue";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { LedgerSigner } from "@taquito/ledger-signer";
import { InMemorySigner } from "@taquito/signer";
import { TezosToolkit, importKey } from "@taquito/taquito";
import { HDPathTemplate, TrezorSigner } from "@taquito/trezor-signer";
import { hex2buf } from "@taquito/utils";
import {
  PermissionScopeMethods,
  WalletConnect,
  NetworkType as WalletConnectNetworkType,
} from "@taquito/wallet-connect";
import * as tezosCrypto from "@tezos-core-tools/crypto-utils";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { toast } from "vue-sonner";

export const useWalletStore = defineStore("wallet", () => {
  const settingsStore = useSettingsStore();

  const Tezos = new TezosToolkit(settingsStore.settings.rpcUrl);

  const wallet = ref<
    | BeaconWallet
    | WalletConnect
    | LedgerSigner
    | ProgrammaticWallet
    | TrezorSigner
  >();
  const ledgerTransport = ref<TransportWebHID | null>(null);
  const address = ref<string>();
  const balance = ref<BigNumber>();
  const walletName = ref<string>();
  const isDisconnecting = ref<boolean>(false);

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
      } else if (
        wallet.value instanceof LedgerSigner ||
        wallet.value instanceof TrezorSigner
      ) {
        return await wallet.value.publicKeyHash();
      } else {
        // Programmatic wallet
        return await wallet.value.getPKH();
      }
    } catch (error) {
      console.error("Error getting address:", error);
      Sentry.captureException(error);
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
      Sentry.captureException(error);
      return undefined;
    }
  };
  const getBalance = computed(() => balance.value);
  const getWalletName = computed(() => walletName.value);

  /** Resets all wallet state variables to undefined and clears the local storage */
  const resetWalletState = async (): Promise<void> => {
    // Clean up Ledger transport if it exists
    if (ledgerTransport.value) {
      try {
        await ledgerTransport.value.close();
      } catch (error) {
        console.error("Error closing Ledger transport during reset:", error);
      } finally {
        ledgerTransport.value = null;
      }
    }

    wallet.value = undefined;
    address.value = undefined;
    balance.value = undefined;
    walletName.value = undefined;

    // Clear any persisted wallet state
    localStorage.removeItem("wallet-provider");
    localStorage.removeItem("web3auth-social-provider");

    // Reset Tezos provider to clear any configured signers/wallets
    // and recreate a fresh instance to fully clear any imported keys.
    // This is necessary because importKey() persists keys in the toolkit instance.
    const freshTezos = new TezosToolkit(settingsStore.settings.rpcUrl);
    Object.assign(Tezos, freshTezos);
  };

  /** Initializes a Beacon wallet */
  const initializeBeaconWallet = async (): Promise<void> => {
    const networkType = import.meta.env.VITE_NETWORK_TYPE as NetworkType;

    const options = {
      name: "Taquito Playground",
      iconUrl: "https://tezostaquito.io/img/favicon.svg",
      network: {
        type: networkType,
        name:
          import.meta.env.VITE_NETWORK_NAME ||
          import.meta.env.VITE_NETWORK_TYPE,
        rpcUrl: settingsStore.settings.rpcUrl,
      },
      enableMetrics: true,
    };

    const beaconWallet = new BeaconWallet(options);

    initializeBeaconEvents(beaconWallet);

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

    initializeWalletConnectEvents(walletConnect);

    const latestSessionKey =
      await walletConnect.getAllExistingSessionKeys()?.[0];

    if (latestSessionKey) {
      await walletConnect.configureWithExistingSessionKey(latestSessionKey);
    } else {
      await walletConnect.requestPermissions({
        permissionScope: {
          networks: [
            import.meta.env.VITE_NETWORK_TYPE as WalletConnectNetworkType,
          ],
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
      Sentry.captureException(error);
      throw new Error(
        `Programmatic wallet initialization failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  /** Initializes a Ledger hardware wallet */
  const initializeLedgerWallet = async (): Promise<void> => {
    let transport: TransportWebHID | null = null;

    try {
      transport = (await TransportWebHID.create()) as TransportWebHID;
      const ledgerSigner = new LedgerSigner(transport);
      Tezos.setProvider({ signer: ledgerSigner });
      wallet.value = ledgerSigner;
      walletName.value = "Ledger Device";
      ledgerTransport.value = transport; // Store reference for cleanup
      localStorage.setItem("wallet-provider", "ledger");
    } catch (error) {
      // Clean up the transport if it was created but connection failed
      if (transport) {
        try {
          await transport.close();
        } catch (closeError) {
          console.error("Error closing Ledger transport:", closeError);
        }
      }
      throw error;
    }
  };

  /** Initializes a Trezor hardware wallet */
  const initializeTrezorWallet = async (): Promise<void> => {
    const transport: TransportWebHID | null = null;

    try {
      await TrezorSigner.init({
        appName: "My Tezos App",
        appUrl: "https://myapp.com",
      });

      const trezorSigner = new TrezorSigner(HDPathTemplate(0));

      Tezos.setProvider({ signer: trezorSigner });
      wallet.value = trezorSigner;
      walletName.value = "Trezor Device";
      ledgerTransport.value = transport; // Store reference for cleanup
      localStorage.setItem("wallet-provider", "trezor");
    } catch (error) {
      // Clean up the transport if it was created but connection failed
      try {
        await TrezorSigner.dispose();
      } catch (closeError) {
        console.error("Error closing Trezor transport:", closeError);
      }
      throw error;
    }
  };

  /** Initializes a Web3Auth wallet using social login */
  const initializeWeb3AuthWallet = async (): Promise<void> => {
    try {
      // Initialize Web3Auth if not already done
      await web3AuthService.initialize();

      // Connect and get provider
      const provider = await web3AuthService.connect();

      if (!provider) {
        throw new Error("No provider returned from Web3Auth");
      }

      // Get user info
      const userInfo = await web3AuthService.getUserInfo();

      // Get the private key from Web3Auth provider
      const privateKeyResponse = await provider.request({
        method: "private_key",
      });

      if (typeof privateKeyResponse !== "string") {
        throw new Error("Failed to retrieve private key from Web3Auth");
      }

      // Remove '0x' prefix if present
      const cleanHexKey = privateKeyResponse.startsWith("0x")
        ? privateKeyResponse.slice(2)
        : privateKeyResponse;

      // Convert hex private key to buffer
      const seedUint8Array = hex2buf(cleanHexKey);

      // Derive Tezos key pair from the seed
      // Cast as Buffer to satisfy type checker (Uint8Array is compatible at runtime)
      const keyPair = tezosCrypto.utils.seedToKeyPair(
        seedUint8Array as unknown as Buffer,
      );

      if (!keyPair.sk) {
        throw new Error("Failed to derive secret key from seed");
      }

      // Initialize InMemorySigner with the derived Tezos secret key
      // Cast to string as the crypto-utils types are inconsistent with some newer versions of TypeScript
      const signer = await InMemorySigner.fromSecretKey(
        keyPair.sk as unknown as string,
      );
      Tezos.setProvider({ signer });

      // Get the address
      const importedAddress = await signer.publicKeyHash();

      // Get display name from user info
      const displayName = userInfo?.name || userInfo?.email || "Web3Auth User";

      // Create a mock wallet object similar to programmatic wallet
      const mockWallet: ProgrammaticWallet = {
        getPKH: async () => {
          return importedAddress;
        },
        getPK: async () => {
          return signer.publicKey();
        },
        requestPermissions: async () => Promise.resolve(),
        disconnect: async () => Promise.resolve(),
        client: {
          getActiveAccount: async () => ({
            address: importedAddress,
          }),
          getPeers: async () => [{ name: `Web3Auth (${displayName})` }],
          disconnect: async () => Promise.resolve(),
          clearActiveAccount: async () => Promise.resolve(),
        },
        getAllExistingSessionKeys: async () => [],
        configureWithExistingSessionKey: async () => Promise.resolve(),
      };

      wallet.value = mockWallet;
      address.value = importedAddress;
      walletName.value = `Web3Auth (${displayName})`;

      localStorage.setItem("wallet-provider", "web3auth");
    } catch (error) {
      console.error("Failed to initialize Web3Auth wallet:", error);
      Sentry.captureException(error);
      throw new Error(
        `Web3Auth wallet initialization failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  /**
   * Initializes a wallet using the network configuration from environment
   * variables. Requests wallet permissions and sets the wallet as the provider
   * for the Tezos instance.
   *
   * @async
   * @param {WalletProvider} provider The provider used to connect the wallet
   * @param {string} privateKeyOrSocialProvider Optional private key for
   *   programmatic wallet or social provider for Web3Auth (google, discord,
   *   email_passwordless)
   * @returns {Promise<void>} Resolves when the wallet is initialized and
   *   permissions are granted.
   * @throws {ReferenceError} If a wallet is already initialized in this
   *   session.
   * @throws {Error} If wallet initialization or permission request fails (e.g.,
   *   user cancels the wallet popup).
   */
  const initializeWallet = async (
    provider: WalletProvider,
    privateKeyOrSocialProvider?: string,
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
        await resetWalletState();
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
          if (!privateKeyOrSocialProvider) {
            throw new Error("No private key found for programmatic wallet");
          }
          await initializeProgrammaticWallet(privateKeyOrSocialProvider);
          break;
        case "ledger":
          await initializeLedgerWallet();
          break;
        case "trezor":
          await initializeTrezorWallet();
          break;
        case "web3auth":
          await initializeWeb3AuthWallet();
          break;
        default:
          throw new TypeError(`Unknown wallet provider: ${provider}`);
      }

      if (wallet.value) {
        if (provider === "walletconnect") {
          Tezos.setProvider({
            wallet: wallet.value as WalletConnect,
          });
        }

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
      await resetWalletState();
      Sentry.captureException(error);
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
  const disconnectWallet = async (fromWallet: boolean = false) => {
    isDisconnecting.value = true;
    try {
      if (!wallet.value) {
        console.warn(
          "Failed to disconnect wallet. No wallet currently connected. Assuming it's been disconnected somewhere else.",
        );
      }

      const walletProvider = localStorage.getItem("wallet-provider");

      if (wallet.value instanceof BeaconWallet) {
        if (!fromWallet) {
          const peers = await wallet.value.client.getPeers();
          for (const peer of peers) {
            await wallet.value.client.removePeer(
              peer as ExtendedPeerInfo,
              true,
            );
          }
        }

        await wallet.value.client.clearActiveAccount();
      } else if (wallet.value instanceof WalletConnect) {
        await wallet.value.disconnect();
        await deleteWalletConnectSessionFromIndexedDB();
      } else if (
        wallet.value instanceof LedgerSigner &&
        ledgerTransport.value
      ) {
        // Clean up Ledger transport when disconnecting
        try {
          await ledgerTransport.value.close();
        } catch (error) {
          console.error(
            "Error closing Ledger transport during disconnect:",
            error,
          );
        } finally {
          ledgerTransport.value = null;
        }
      } else if (walletProvider === "web3auth") {
        await web3AuthService.disconnect();
      }

      await resetWalletState();

      if (fromWallet) {
        toast.info(
          "Your wallet has been disconnected due to a disconnect request from your wallet.",
        );
      }
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      await resetWalletState();
      throw error;
    } finally {
      isDisconnecting.value = false;
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
      Sentry.captureException(error);
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
    address,
    isDisconnecting,
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
