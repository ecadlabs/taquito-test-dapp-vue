import { useWalletStore } from "@/stores/walletStore";
import { useDiagramStore } from "@/stores/diagramStore";
const TEST_ID = 'increase-paid-storage';

const increaseStorage = async (contract: string, bytes: number) => {
	const diagramStore = useDiagramStore();
	const walletStore = useWalletStore();

	const Tezos = walletStore.getTezos;

	try {
		// Validate input parameters
		if (!contract || bytes <= 0 || bytes > 10) {
			throw new Error('Invalid contract address or byte amount');
		}

		diagramStore.setTestDiagram(TEST_ID, 'increase');
		diagramStore.setProgress('estimate-fees', 'running', TEST_ID);

		await new Promise(resolve => setTimeout(resolve, 2000));

		diagramStore.setProgress('wait-for-user', 'running', TEST_ID);
		const operation = await Tezos.wallet.increasePaidStorage({ amount: bytes, destination: contract }).send();

		diagramStore.setProgress('wait-for-chain-confirmation', 'running', TEST_ID);
		const confirmation = await operation.confirmation(3);
		if (confirmation?.block.hash) diagramStore.setOperationHash(confirmation?.block.hash, TEST_ID);

		diagramStore.setProgress('success', 'completed', TEST_ID);
		await walletStore.fetchBalance();
	} catch (error) {
		console.error(`Failed to increase paid storage on contract '${contract}': ${error}`);
		diagramStore.setErrorMessage(error, TEST_ID);
		throw error;
	}
}

export { increaseStorage }