import { useWalletStore } from "@/stores/walletStore";
import { useDiagramStore } from "@/stores/diagramStore";
import { PiggyBank } from 'lucide-vue-next';
import type { Estimate } from "@taquito/taquito";

const TEST_ID = 'transfer';

let estimate: Estimate;
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
		estimate = await Tezos.estimate.transfer({ to, amount: amount });

		// Set the button for the estimate-fees node
		diagramStore.setNodeButton('estimate-fees', {
			icon: PiggyBank,
			text: 'View Fees',
			onClick: () => diagramStore.showFeeEstimationDialog(estimate)
		});

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
	}
}

export { send }