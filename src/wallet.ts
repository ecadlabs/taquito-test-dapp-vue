import { BeaconWallet } from "@taquito/beacon-wallet";
import { NetworkType } from "@airgap/beacon-types";
import { TezosToolkit } from "@taquito/taquito";

const Tezos: TezosToolkit = new TezosToolkit(import.meta.env.VITE_RPC_URL);

const initializeWallet = async (): Promise<void> => {
	const options = {
		name: 'TaquitoTestDapp',
		iconUrl: 'https://tezostaquito.io/img/favicon.svg',
		network: {
			type: NetworkType.GHOSTNET,
		},
	};
	const wallet = new BeaconWallet(options);
	await wallet.requestPermissions();
	Tezos.setWalletProvider(wallet);
}

export default { initializeWallet }
