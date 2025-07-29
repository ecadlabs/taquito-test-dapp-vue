import { useWalletStore } from "@/stores/walletStore";

const send = async (to: string, amount: number) => {
	const walletStore = useWalletStore();
	const Tezos = walletStore.getTezos;

	try {
		await Tezos.wallet.transfer({ to, amount }).send();
	} catch (error) {
		console.error(`Failed to send transfer to '${to}': ${error}`);
		throw error;
	}
}

export { send }