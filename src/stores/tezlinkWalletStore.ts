import {
  initializeBeaconEvents,
  initializeWalletConnectEvents,
} from "@/lib/walletEvents";
import { createWalletStore } from "@/stores/createWalletStore";
import { NetworkType } from "@airgap/beacon-types";

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
    rpcUrl: "https://node.shared.tezlink.nomadic-labs.com/",
    networkType: NetworkType.CUSTOM,
    networkName: "Tezlink",
    localStoragePrefix: "tezlink-wallet",
    appName: "Taquito Playground (Tezlink)",
  },
  {
    beacon: initializeBeaconEvents,
    walletConnect: initializeWalletConnectEvents,
  },
);
