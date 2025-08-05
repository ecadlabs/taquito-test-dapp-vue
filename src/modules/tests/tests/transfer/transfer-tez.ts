import { useWalletStore } from "@/stores/walletStore";
import { useDiagramStore } from "@/stores/diagramStore";

const TEST_ID = 'transfer';

const send = async (to: string, amount: number) => {
	const diagramStore = useDiagramStore();
	const walletStore = useWalletStore();
	const Tezos = walletStore.getTezos;

	try {
		// Validate input parameters
		if (!to || amount <= 0) {
			throw new Error('Invalid recipient address or amount');
		}

		diagramStore.setProgress('estimate-fees', 'running', TEST_ID);

		await new Promise(resolve => setTimeout(resolve, 2000));

		// const estimate = await Tezos.estimate.transfer({ to, amount });
		// console.log(estimate);

		diagramStore.setProgress('wait-for-user', 'running', TEST_ID);
		const transfer = await Tezos.wallet.transfer({ to, amount }).send();

		diagramStore.setProgress('wait-for-chain-confirmation', 'running', TEST_ID);
		const confirmation = await transfer.confirmation();

		if (confirmation?.block.hash) diagramStore.setOperationHash(confirmation?.block.hash, TEST_ID);

		diagramStore.setProgress('success', 'completed', TEST_ID);
		await walletStore.fetchBalance();
	} catch (error) {
		console.error(`Failed to send transfer to '${to}': ${error}`);
		diagramStore.setErrorMessage(error, TEST_ID);
		throw error;
	}
}

export { send }