import { web3AuthService } from "@/services/web3AuthService";
import type { ProgrammaticWallet, WalletProvider } from "@/types/wallet";
import { NetworkType, type ExtendedPeerInfo } from "@airgap/beacon-types";
import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import * as Sentry from "@sentry/vue";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { LedgerSigner } from "@taquito/ledger-signer";
import { InMemorySigner } from "@taquito/signer";
import { TezosToolkit, importKey } from "@taquito/taquito";
import { hex2buf } from "@taquito/utils";
import {
  PermissionScopeMethods,
  WalletConnect,
  NetworkType as WalletConnectNetworkType,
} from "@taquito/wallet-connect";
import * as tezosCrypto from "@tezos-core-tools/crypto-utils";
import type BigNumber from "bignumber.js";
import { defineStore, type StoreDefinition } from "pinia";
import { computed, ref, type ComputedRef, type Ref } from "vue";
import { toast } from "vue-sonner";

/** Configuration for creating a wallet store instance */
export interface WalletStoreConfig {
  /** Unique name for the Pinia store */
  storeName: string;
  /**
   * RPC URL for the Tezos network - can be a string or a function that returns
   * the URL
   */
  rpcUrl: string | (() => string);
  /** Network type for Beacon wallet */
  networkType: NetworkType;
  /** Display name for the network */
  networkName: string;
  /** Prefix for localStorage keys to avoid conflicts */
  localStoragePrefix: string;
  /** App name shown in wallet connection dialogs */
  appName?: string;
  /** App icon URL shown in wallet connection dialogs */
  appIconUrl?: string;
}

/** Type for the wallet store returned by the factory */
export interface WalletStoreState {
  Tezos: TezosToolkit;
  address: Ref<string | undefined>;
  isDisconnecting: Ref<boolean>;
  getTezos: ComputedRef<TezosToolkit>;
  getAddress: ComputedRef<string | undefined>;
  getBalance: ComputedRef<BigNumber | undefined>;
  getWallet: ComputedRef<
    BeaconWallet | WalletConnect | LedgerSigner | ProgrammaticWallet | undefined
  >;
  getWalletName: ComputedRef<string | undefined>;
  initializeWallet: (
    provider: WalletProvider,
    privateKeyOrSocialProvider?: string,
  ) => Promise<void>;
  disconnectWallet: (fromWallet?: boolean) => Promise<void>;
  fetchBalance: () => Promise<void>;
  getWalletConnectSessionFromIndexedDB: () => Promise<string | undefined>;
  getWalletAddress: () => Promise<string | undefined>;
  getWalletPublicKey: () => Promise<string | undefined>;
}

/** Event initializer function type for wallet events */
export type BeaconEventInitializer = (
  beaconWallet: BeaconWallet,
  store: WalletStoreState,
) => void;

export type WalletConnectEventInitializer = (
  walletConnect: WalletConnect,
  store: WalletStoreState,
) => void;

/**
 * Creates a wallet store with the given configuration. This factory function
 * allows creating multiple wallet stores for different networks.
 */
export const createWalletStore = (
  config: WalletStoreConfig,
  eventInitializers?: {
    beacon?: BeaconEventInitializer;
    walletConnect?: WalletConnectEventInitializer;
  },
): StoreDefinition<string, WalletStoreState> => {
  const {
    storeName,
    rpcUrl,
    networkType,
    networkName,
    localStoragePrefix,
    appName = "Taquito Playground",
    appIconUrl = "https://tezostaquito.io/img/favicon.svg",
  } = config;

  return defineStore(storeName, () => {
    // Resolve rpcUrl if it's a function
    const resolvedRpcUrl = typeof rpcUrl === "function" ? rpcUrl() : rpcUrl;
    const Tezos = new TezosToolkit(resolvedRpcUrl);

    const wallet = ref<
      BeaconWallet | WalletConnect | LedgerSigner | ProgrammaticWallet
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
        } else if (wallet.value instanceof LedgerSigner) {
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

    /**
     * Resets all wallet state variables to undefined and clears the local
     * storage
     */
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
      localStorage.removeItem(`${localStoragePrefix}-provider`);
      localStorage.removeItem(`${localStoragePrefix}-web3auth-social-provider`);

      // Reset Tezos provider to clear any configured signers/wallets
      // and recreate a fresh instance to fully clear any imported keys.
      // This is necessary because importKey() persists keys in the toolkit instance.
      const freshTezos = new TezosToolkit(resolvedRpcUrl);
      Object.assign(Tezos, freshTezos);
    };

    /** Initializes a Beacon wallet */
    const initializeBeaconWallet = async (): Promise<void> => {
      const options = {
        name: appName,
        iconUrl: appIconUrl,
        network: {
          type: networkType,
          name: networkName,
          rpcUrl: resolvedRpcUrl,
        },
        enableMetrics: true,
      };

      console.log("Beacon wallet options:", options);

      const beaconWallet = new BeaconWallet(options);

      // Initialize events using the provided initializer or skip if not provided
      if (eventInitializers?.beacon) {
        eventInitializers.beacon(beaconWallet, {
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
        });
      }

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

      localStorage.setItem(`${localStoragePrefix}-provider`, "beacon");
    };

    /** Initializes a WalletConnect wallet */
    const initializeWalletConnect = async (): Promise<void> => {
      const walletConnect = await WalletConnect.init({
        projectId: import.meta.env.VITE_REOWN_PROJECT_ID,
        metadata: {
          name: appName,
          description: "Learning and examples for the Taquito project",
          icons: [appIconUrl],
          url: "",
        },
      });

      if (!walletConnect)
        throw ReferenceError(
          "Wallet not found after WalletConnect initialization should have finished.",
        );

      // Initialize events using the provided initializer or skip if not provided
      if (eventInitializers?.walletConnect) {
        eventInitializers.walletConnect(walletConnect, {
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
        });
      }

      const latestSessionKey =
        await walletConnect.getAllExistingSessionKeys()?.[0];

      if (latestSessionKey) {
        await walletConnect.configureWithExistingSessionKey(latestSessionKey);
      } else {
        // Map network type to WalletConnect network type
        // Note: WalletConnect has a limited set of supported networks
        let wcNetworkType: WalletConnectNetworkType;
        if (networkType === NetworkType.MAINNET) {
          wcNetworkType = WalletConnectNetworkType.MAINNET;
        } else if (networkType === NetworkType.GHOSTNET) {
          wcNetworkType = WalletConnectNetworkType.GHOSTNET;
        } else {
          // For custom/unsupported networks, default to GHOSTNET
          // WalletConnect may not work correctly with truly custom networks
          wcNetworkType = WalletConnectNetworkType.GHOSTNET;
        }

        await walletConnect.requestPermissions({
          permissionScope: {
            networks: [wcNetworkType],
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
      localStorage.setItem(`${localStoragePrefix}-provider`, "walletconnect");
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
        localStorage.setItem(`${localStoragePrefix}-provider`, "ledger");
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
        const displayName =
          userInfo?.name || userInfo?.email || "Web3Auth User";

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

        localStorage.setItem(`${localStoragePrefix}-provider`, "web3auth");
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
     * variables. Requests wallet permissions and sets the wallet as the
     * provider for the Tezos instance.
     */
    const initializeWallet = async (
      provider: WalletProvider,
      privateKeyOrSocialProvider?: string,
    ): Promise<void> => {
      console.log(
        "Starting initialization of wallet using provider:",
        provider,
      );
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

    /** Disconnects the currently connected wallet. */
    const disconnectWallet = async (fromWallet: boolean = false) => {
      isDisconnecting.value = true;
      try {
        if (!wallet.value) {
          console.warn(
            "Failed to disconnect wallet. No wallet currently connected. Assuming it's been disconnected somewhere else.",
          );
        }

        const walletProvider = localStorage.getItem(
          `${localStoragePrefix}-provider`,
        );

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
     * Asynchronously fetches the balance for the current wallet address from
     * the Tezos network and updates the `balance` state value.
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

    /** Performs an operation on the WalletConnect session stored in IndexedDB. */
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

    /** Retrieves the WalletConnect session from IndexedDB if it exists. */
    const getWalletConnectSessionFromIndexedDB = async (): Promise<
      string | undefined
    > => {
      return walletConnectIndexedDBOperation("readonly", (store, sessionKey) =>
        store.get(sessionKey),
      );
    };

    /** Deletes the WalletConnect session from IndexedDB if it exists. */
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
  }) as unknown as StoreDefinition<string, WalletStoreState>;
};
