import { useWalletStore } from "@/stores/walletStore";
import { BeaconEvent } from "@airgap/beacon-dapp";
import type { BeaconWallet } from "@taquito/beacon-wallet";
import type { WalletConnect } from "@taquito/wallet-connect";

const initializeWalletConnectEvents = (walletConnect: WalletConnect) => {
  const walletStore = useWalletStore();

  walletConnect.signClient.on("session_delete", () => {
    walletStore.disconnectWallet(true);
  });
};

const initializeBeaconEvents = (beaconWallet: BeaconWallet) => {
  const walletStore = useWalletStore();

  beaconWallet.client.subscribeToEvent(
    BeaconEvent.ACTIVE_ACCOUNT_SET,
    (account) => {
      if (account) {
        walletStore.address = account.address;
      } else if (
        account === undefined &&
        walletStore.address &&
        !walletStore.isDisconnecting
      ) {
        walletStore.disconnectWallet(true);
      }
    },
  );
};

export { initializeBeaconEvents, initializeWalletConnectEvents };
