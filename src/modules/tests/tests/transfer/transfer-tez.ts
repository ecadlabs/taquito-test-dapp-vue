import { useWalletStore } from "@/stores/walletStore";
import { useDiagramStore } from "@/stores/diagramStore";
import { PiggyBank } from 'lucide-vue-next';
import type { Estimate } from "@taquito/taquito";

const TEST_ID = 'transfer';

let estimate: Estimate | undefined = undefined;
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
			onClick: showFees
		});

		console.log(
			`burnFeeMutez : ${estimate.burnFeeMutez},
			gasLimit : ${estimate.gasLimit},
			minimalFeeMutez : ${estimate.minimalFeeMutez},
			storageLimit : ${estimate.storageLimit},
			suggestedFeeMutez : ${estimate.suggestedFeeMutez},
			totalCost : ${estimate.totalCost},
			usingBaseFeeMutez : ${estimate.usingBaseFeeMutez}`
		);

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

const showFees = () => {
	const diagramStore = useDiagramStore();
	const dialogContent = {
		title: 'Transaction Fees',
		description: 'Transaction fee breakdown',
		content: `
				<div class="space-y-2">
					<div class="flex justify-between">
						<span class="font-medium">Burn Fee:</span>
						<span>${estimate?.burnFeeMutez} mutez</span>
					</div>
					<div class="flex justify-between">
						<span class="font-medium">Gas Limit:</span>
						<span>${estimate?.gasLimit}</span>
					</div>
					<div class="flex justify-between">
						<span class="font-medium">Minimal Fee:</span>
						<span>${estimate?.minimalFeeMutez} mutez</span>
					</div>
					<div class="flex justify-between">
						<span class="font-medium">Storage Limit:</span>
						<span>${estimate?.storageLimit}</span>
					</div>
					<div class="flex justify-between">
						<span class="font-medium">Suggested Fee:</span>
						<span>${estimate?.suggestedFeeMutez} mutez</span>
					</div>
					<div class="flex justify-between">
						<span class="font-medium">Total Cost:</span>
						<span>${estimate?.totalCost} mutez</span>
					</div>
					<div class="flex justify-between">
						<span class="font-medium">Using Base Fee:</span>
						<span>${estimate?.usingBaseFeeMutez} mutez</span>
					</div>
				</div>
			`
	};

	// Trigger the dialog with custom content
	diagramStore.openDialog(dialogContent);
}

export { send, showFees }