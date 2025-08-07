import { useWalletStore } from "@/stores/walletStore";
import { useDiagramStore } from "@/stores/diagramStore";
import { PiggyBank } from 'lucide-vue-next';
import type { Estimate } from "@taquito/taquito";

const TEST_ID = 'estimate-fees';
const address = 'tz1VRj54TQDtUGgv6gF4AbGbXMphyDpVkCpf';

let estimate: Estimate | undefined = undefined;
const estimateFees = async () => {
	const diagramStore = useDiagramStore();
	const walletStore = useWalletStore();

	const Tezos = walletStore.getTezos;

	try {
		diagramStore.setProgress('estimate-fees', 'running', TEST_ID);
		estimate = await Tezos.estimate.transfer({ to: address, amount: 1 });

		// Set the button for the estimate-fees node
		diagramStore.setNodeButton('estimate-fees', {
			icon: PiggyBank,
			text: 'View Fees',
			onClick: showFees
		});

		diagramStore.setProgress('success', 'completed', TEST_ID);
		await walletStore.fetchBalance();
	} catch (error) {
		console.error(`Failed to estiimate fees for transfer to '${address}': ${error}`);
		diagramStore.setErrorMessage(error, TEST_ID);
		throw error;
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

export { estimateFees, showFees }