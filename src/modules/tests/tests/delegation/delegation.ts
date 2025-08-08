import { useWalletStore } from "@/stores/walletStore";
import { useDiagramStore } from "@/stores/diagramStore";
import { PiggyBank } from 'lucide-vue-next';
import type { Estimate } from "@taquito/taquito";

const TEST_ID = 'delegation';
let estimate: Estimate | undefined = undefined;

const delegate = async (address: string) => {
	const diagramStore = useDiagramStore();
	diagramStore.setTestDiagram(TEST_ID, 'set-delegate');

	const walletStore = useWalletStore();
	const Tezos = walletStore.getTezos;

	try {
		if (!address) throw new Error('No address found to delegate to');
		if (!walletStore.getAddress) throw new Error('No address found to delegate from');

		diagramStore.setProgress('estimate-fees', 'running', TEST_ID);
		estimate = await Tezos.estimate.setDelegate({ source: walletStore.getAddress, delegate: address });

		diagramStore.setNodeButton('estimate-fees', {
			icon: PiggyBank,
			text: 'View Fees',
			onClick: showFees
		});

		diagramStore.setProgress('set-delegate', 'running', TEST_ID);
		diagramStore.setProgress('wait-for-user', 'running', TEST_ID);
		const delegation = await Tezos.wallet.setDelegate({ delegate: address }).send();

		diagramStore.setProgress('wait-for-chain-confirmation', 'running', TEST_ID);
		const confirmation = await delegation.confirmation();

		if (confirmation?.block.hash) diagramStore.setOperationHash(confirmation?.block.hash, TEST_ID);

		diagramStore.setProgress('success', 'completed', TEST_ID);
		await walletStore.fetchBalance();
	} catch (error) {
		console.error(`Failed to delegate to '${address}': ${error}`);
		diagramStore.setErrorMessage(error, TEST_ID);
	}
}

const undelegate = async () => {
	const diagramStore = useDiagramStore();
	diagramStore.setTestDiagram(TEST_ID, 'remove-delegation');

	const walletStore = useWalletStore();
	const Tezos = walletStore.getTezos;

	try {
		if (!walletStore.getAddress) throw new Error('No address found remove delegation for');

		diagramStore.setProgress('estimate-fees', 'running', TEST_ID);
		estimate = await Tezos.estimate.setDelegate({ source: walletStore.getAddress });

		diagramStore.setNodeButton('estimate-fees', {
			icon: PiggyBank,
			text: 'View Fees',
			onClick: showFees
		});

		diagramStore.setProgress('remove-delegation', 'running', TEST_ID);
		diagramStore.setProgress('wait-for-user', 'running', TEST_ID);
		const delegation = await Tezos.wallet.setDelegate({}).send();

		diagramStore.setProgress('wait-for-chain-confirmation', 'running', TEST_ID);
		const confirmation = await delegation.confirmation();

		if (confirmation?.block.hash) diagramStore.setOperationHash(confirmation?.block.hash, TEST_ID);

		diagramStore.setProgress('success', 'completed', TEST_ID);
		await walletStore.fetchBalance();
	} catch (error) {
		console.error(`Failed to undelegate: ${error}`);
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

export { delegate, undelegate, showFees }