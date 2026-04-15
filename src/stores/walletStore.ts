import {
  initializeBeaconEvents,
  initializeWalletConnectEvents,
} from "@/lib/walletEvents";
import { getWalletConfig } from "@/networks/network-registry";
import { createWalletStore } from "@/stores/createWalletStore";
import { useSettingsStore } from "@/stores/settingsStore";

const networkId =
  (import.meta.env.VITE_NETWORK_NAME as string) ||
  (import.meta.env.VITE_NETWORK_TYPE as string);
const walletConfig = getWalletConfig(networkId);

if (!walletConfig) {
  throw new Error(`No wallet config found for network "${networkId}"`);
}

/**
 * Main wallet store for Tezos L1 network. Uses the network configuration from
 * environment variables and settings.
 */
export const useWalletStore = createWalletStore(
  {
    storeName: "wallet",
    // Use a getter function to access settingsStore at runtime
    rpcUrl: () => useSettingsStore().settings.rpcUrl,
    beaconNetworkType: walletConfig.beacon.networkType,
    beaconNetworkName: walletConfig.beacon.networkName,
    walletConnectNetworkType: walletConfig.walletConnect.networkType,
    localStoragePrefix: "wallet",
    appName: walletConfig.appName,
  },
  {
    beacon: initializeBeaconEvents,
    walletConnect: initializeWalletConnectEvents,
  },
);
