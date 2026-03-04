import type { WalletStoreState } from "@/stores/createWalletStore";
import type { BeaconWallet } from "@taquito/beacon-wallet";
import { BeaconEvent } from "@taquito/beacon-wallet";
import type { WalletConnect } from "@taquito/wallet-connect";

const initializeWalletConnectEvents = (
  walletConnect: WalletConnect,
  walletStore: WalletStoreState,
) => {
  walletConnect.signClient.on("session_delete", () => {
    walletStore.disconnectWallet(true);
  });
};

const initializeBeaconEvents = (
  beaconWallet: BeaconWallet,
  walletStore: WalletStoreState,
) => {
  beaconWallet.client.subscribeToEvent(
    BeaconEvent.ACTIVE_ACCOUNT_SET,
    (account) => {
      if (account) {
        walletStore.address.value = account.address;
      } else if (
        account === undefined &&
        walletStore.address.value &&
        !walletStore.isDisconnecting.value
      ) {
        walletStore.disconnectWallet(true);
      }
    },
  );
};

export { initializeBeaconEvents, initializeWalletConnectEvents };
