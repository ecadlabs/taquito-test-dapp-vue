import { useWalletStore } from "@/stores/walletStore";
import { useDiagramStore } from "@/stores/diagramStore";

const send = async (to: string, amount: number) => {
	const diagramStore = useDiagramStore();
	const walletStore = useWalletStore();
	const Tezos = walletStore.getTezos;

	try {
		diagramStore.setProgress('validate-input', 'running');

		// Validate input parameters
		if (!to || amount <= 0) {
			throw new Error('Invalid recipient address or amount');
		}

		diagramStore.setProgress('create-transaction', 'running');
		const transfer = await Tezos.wallet.transfer({ to, amount }).send();

		diagramStore.setProgress('send-transaction', 'running');
		diagramStore.setProgress('wait-confirmation', 'running');
		await transfer.confirmation();
		diagramStore.setProgress('success', 'completed');

		await walletStore.fetchBalance();
	} catch (error) {
		console.error(`Failed to send transfer to '${to}': ${error}`);
		diagramStore.setErrored();
		diagramStore.setErrorMessage(error);
		throw error;
	}
}

export { send }