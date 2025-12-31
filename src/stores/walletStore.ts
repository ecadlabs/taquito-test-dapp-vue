import {
  initializeBeaconEvents,
  initializeWalletConnectEvents,
} from "@/lib/walletEvents";
import { createWalletStore } from "@/stores/createWalletStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { NetworkType } from "@airgap/beacon-types";

const networkType = import.meta.env.VITE_NETWORK_TYPE as NetworkType;
const networkName =
  (import.meta.env.VITE_NETWORK_NAME as string) ||
  (import.meta.env.VITE_NETWORK_TYPE as string);

/**
 * Main wallet store for Tezos L1 network. Uses the network configuration from
 * environment variables and settings.
 */
export const useWalletStore = createWalletStore(
  {
    storeName: "wallet",
    // Use a getter function to access settingsStore at runtime
    rpcUrl: () => useSettingsStore().settings.rpcUrl,
    networkType,
    networkName,
    localStoragePrefix: "wallet",
  },
  {
    beacon: initializeBeaconEvents,
    walletConnect: initializeWalletConnectEvents,
  },
);
