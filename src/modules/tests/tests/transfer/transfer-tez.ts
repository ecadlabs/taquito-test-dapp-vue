import { useWalletStore } from "@/stores/walletStore";
import { useDiagramStore } from "@/stores/diagramStore";

const send = async (to: string, amount: number) => {
	const diagramStore = useDiagramStore();
	const walletStore = useWalletStore();
	const Tezos = walletStore.getTezos;

	try {
		// Set progress: Validate input
		diagramStore.setProgress('validate-input', 'running');

		// Validate input parameters
		if (!to || amount <= 0) {
			throw new Error('Invalid recipient address or amount');
		}

		diagramStore.setProgress('validate-input', 'completed');
		diagramStore.setProgress('create-transaction', 'running');

		// Set progress: Create transaction
		const transfer = await Tezos.wallet.transfer({ to, amount }).send();

		diagramStore.setProgress('create-transaction', 'completed');
		diagramStore.setProgress('send-transaction', 'running');

		// Set progress: Send transaction
		diagramStore.setProgress('send-transaction', 'completed');
		diagramStore.setProgress('wait-confirmation', 'running');

		// Set progress: Wait for confirmation
		const confirmationResponse = await transfer.confirmation();
		console.log(confirmationResponse);

		diagramStore.setProgress('wait-confirmation', 'completed');
		diagramStore.setProgress('success', 'completed');

		await walletStore.fetchBalance();
	} catch (error) {
		console.error(`Failed to send transfer to '${to}': ${error}`);
		diagramStore.setErrored();
		throw error;
	}
}

export { send }