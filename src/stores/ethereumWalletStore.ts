import { BrowserProvider, formatEther, type Eip1193Provider } from "ethers";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

let provider: BrowserProvider | null = null;
let eventListenersAttached = false;

/** Pinia store for managing Ethereum/EVM wallet connection (MetaMask, etc.) */
export const useEthereumWalletStore = defineStore("ethereumWallet", () => {
  const address = ref<string | null>(null);
  const balance = ref<string | null>(null);
  const chainId = ref<string | null>(null);
  const isConnected = ref<boolean>(false);
  const isConnecting = ref<boolean>(false);
  const error = ref<string | null>(null);

  // Getters
  const getAddress = computed(() => address.value);
  const getBalance = computed(() => balance.value);
  const getChainId = computed(() => chainId.value);
  const getIsConnected = computed(() => isConnected.value);
  const getIsConnecting = computed(() => isConnecting.value);
  const getError = computed(() => error.value);

  /** Updates the balance for the current Ethereum wallet address */
  const updateBalance = async (): Promise<void> => {
    if (!provider || !address.value) {
      return;
    }

    try {
      const balanceValue = await provider.getBalance(address.value);
      balance.value = formatEther(balanceValue);
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    }
  };

  /** Connects to the Ethereum wallet (e.g., MetaMask) */
  const connectWallet = async (): Promise<void> => {
    if (typeof window.ethereum === "undefined") {
      error.value = "MetaMask or another EVM wallet is not installed";
      throw new Error(error.value);
    }

    try {
      isConnecting.value = true;
      error.value = null;

      provider = new BrowserProvider(window.ethereum as Eip1193Provider);

      const accounts = await provider.send("eth_requestAccounts", []);

      if (accounts.length === 0) {
        throw new Error("No accounts found");
      }

      address.value = accounts[0];
      isConnected.value = true;

      const network = await provider.getNetwork();
      chainId.value = network.chainId.toString();

      await updateBalance();

      localStorage.setItem("ethereum-wallet-connected", "true");

      if (!eventListenersAttached) {
        attachEventListeners();
      }
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      error.value =
        err instanceof Error ? err.message : "Failed to connect wallet";
      isConnected.value = false;
      throw err;
    } finally {
      isConnecting.value = false;
    }
  };

  /** Disconnects the Ethereum wallet and resets state */
  const disconnectWallet = async (): Promise<void> => {
    // Try to revoke permissions using EIP-2255 if supported (like MetaMask <3)
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch (err) {
        // Most wallets don't support this yet, so we silently continue if it fails
        console.log("wallet_revokePermissions not supported or failed:", err);
      }
    }

    address.value = null;
    balance.value = null;
    chainId.value = null;
    isConnected.value = false;
    error.value = null;
    provider = null;
    // Remove connection state to prevent auto-reconnection on page reload after manually disconnecting
    localStorage.removeItem("ethereum-wallet-connected");
  };

  /** Checks if the wallet is already connected and initializes the connection */
  const checkConnection = async (): Promise<void> => {
    if (!window.ethereum) return;

    // Only auto-reconnect if user was previously connected
    const wasConnected = localStorage.getItem("ethereum-wallet-connected");
    if (!wasConnected) return;

    try {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      if (accounts.length > 0) {
        await connectWallet();
      }
    } catch (err) {
      console.error("Failed to check connection:", err);
    }
  };

  // Event handlers
  const handleAccountsChanged = (...args: unknown[]): void => {
    const accounts = args[0] as string[];
    if (accounts.length === 0) {
      void disconnectWallet();
    } else {
      address.value = accounts[0];
      void updateBalance();
    }
  };

  const handleChainChanged = (...args: unknown[]): void => {
    const chainIdHex = args[0] as string;
    chainId.value = parseInt(chainIdHex, 16).toString();
    void updateBalance();
  };

  const handleDisconnect = (): void => {
    void disconnectWallet();
  };

  /** Attaches event listeners to the Ethereum provider */
  const attachEventListeners = (): void => {
    if (!window.ethereum || eventListenersAttached) return;

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    window.ethereum.on("disconnect", handleDisconnect);

    eventListenersAttached = true;
  };

  /** Removes event listeners from the Ethereum provider */
  const removeEventListeners = (): void => {
    if (!window.ethereum || !eventListenersAttached) return;

    window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    window.ethereum.removeListener("chainChanged", handleChainChanged);
    window.ethereum.removeListener("disconnect", handleDisconnect);

    eventListenersAttached = false;
  };

  /** Initializes the store (should be called when the app starts) */
  const initialize = async (): Promise<void> => {
    attachEventListeners();
    await checkConnection();
  };

  /** Cleans up the store (should be called when the app unmounts) */
  const cleanup = (): void => {
    removeEventListeners();
  };

  return {
    // State
    address,
    balance,
    chainId,
    isConnected,
    isConnecting,
    error,

    // Getters
    getAddress,
    getBalance,
    getChainId,
    getIsConnected,
    getIsConnecting,
    getError,

    // Actions
    connectWallet,
    disconnectWallet,
    updateBalance,
    checkConnection,
    initialize,
    cleanup,
  };
});
