import {
  initializeBeaconEvents,
  initializeWalletConnectEvents,
} from "@/lib/walletEvents";
import { getWalletConfig } from "@/networks/network-registry";
import { createWalletStore } from "@/stores/createWalletStore";

const tezlinkWalletConfig = getWalletConfig("tezlink-shadownet");

if (!tezlinkWalletConfig) {
  throw new Error(`No wallet config found for network "tezlink-shadownet"`);
}

/**
 * Wallet store for Tezlink L2 network. Used for bridging operations from
 * Tezlink back to Tezos L1.
 *
 * Tezlink is a Tezos-based L2, so it uses standard Tezos wallets (Beacon,
 * WalletConnect, Ledger, etc.) connected to the Tezlink network.
 */
export const useTezlinkWalletStore = createWalletStore(
  {
    storeName: "tezlink-wallet",
    rpcUrl: import.meta.env[tezlinkWalletConfig.rpcEnvVar],
    beaconNetworkType: tezlinkWalletConfig.beacon.networkType,
    beaconNetworkName: tezlinkWalletConfig.beacon.networkName,
    walletConnectNetworkType: tezlinkWalletConfig.walletConnect.networkType,
    localStoragePrefix: "tezlink-wallet",
    appName: tezlinkWalletConfig.appName,
  },
  {
    beacon: initializeBeaconEvents,
    walletConnect: initializeWalletConnectEvents,
  },
);
