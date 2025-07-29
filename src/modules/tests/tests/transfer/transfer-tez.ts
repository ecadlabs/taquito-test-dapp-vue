import { useWalletStore } from "@/stores/walletStore";

const send = async (to: string, amount: number) => {
	const walletStore = useWalletStore();
	const Tezos = walletStore.getTezos;

	try {
		const transfer = await Tezos.wallet.transfer({ to, amount }).send();
		// May want to make the number of confirmations configurable
		const confirmationResponse = await transfer.confirmation();
		console.log(confirmationResponse);

		await walletStore.fetchBalance();
	} catch (error) {
		console.error(`Failed to send transfer to '${to}': ${error}`);
		throw error;
	}
}

export { send }