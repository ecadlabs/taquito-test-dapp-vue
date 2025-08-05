import { useWalletStore } from "@/stores/walletStore"
import { useDiagramStore } from "@/stores/diagramStore"

// const CONTRACT_ADDRESS = 'KT1AoX6862rfFB5F1yxiE6Y8EwTQz8G1WEBb';
const CONTRACT_ADDRESS = 'KT1RLWdB5zJcN7RVqu5MRWp3gvkMUGEpuc1d'

const TEST_ID = 'counter-contract';

/**
 * Increments the contract storage value by the specified amount.
 * 
 * @async
 * @param {number} amount - The amount to increment the storage by (must be between 1 and 100 inclusive).
 * @throws {Error} If the amount is not within the valid range.
 * @returns {Promise<void>}
 */
const increment = async (amount: number): Promise<void> => {
	const diagramStore = useDiagramStore();

	if (amount <= 0 || amount > 100) throw new Error('Incrementation value must be between 1 and 100 inclusive.');

	const walletStore = useWalletStore();
	const Tezos = walletStore.getTezos;

	try {
		diagramStore.setProgress('get-contract', 'running', TEST_ID);

		const contract = await Tezos.wallet.at(CONTRACT_ADDRESS);
		console.log(`Incrementing storage value by ${amount}...`);

		diagramStore.setProgress('execute-operation', 'running', TEST_ID);

		const operation = await contract.methodsObject.increment(amount).send();

		diagramStore.setProgress('wait-confirmation', 'running', TEST_ID);
		const confirmation = await operation.confirmation(3);
		if (confirmation?.block.hash) diagramStore.setOperationHash(confirmation?.block.hash, TEST_ID);
		diagramStore.setProgress('success', 'completed', TEST_ID);

	} catch (error) {
		console.log(`Error: ${JSON.stringify(error, null, 2)}`)
		diagramStore.setErrorMessage(error, TEST_ID);
	}
}

/**
 * Decrements the contract storage value by the specified amount.
 * 
 * @async
 * @param {number} amount - The amount to decrement the storage by (must be between 1 and 100 inclusive).
 * @throws {Error} If the amount is not within the valid range.
 * @returns {Promise<void>}
 */
const decrement = async (amount: number): Promise<void> => {
	const diagramStore = useDiagramStore();

	if (amount <= 0 || amount > 100) throw new Error('Decrementation value must be between 1 and 100 inclusive.');

	const walletStore = useWalletStore();
	const Tezos = walletStore.getTezos;

	try {
		diagramStore.setProgress('get-contract', 'running', TEST_ID);
		const contract = await Tezos.wallet.at(CONTRACT_ADDRESS);
		diagramStore.setProgress('execute-operation', 'running', TEST_ID);
		const operation = await contract.methodsObject.decrement(amount).send();
		diagramStore.setProgress('wait-confirmation', 'running', TEST_ID);
		const confirmation = await operation.confirmation(3);
		if (confirmation?.block.hash) diagramStore.setOperationHash(confirmation?.block.hash, TEST_ID);
		diagramStore.setProgress('success', 'completed', TEST_ID);

	} catch (error) {
		console.log(`Error: ${JSON.stringify(error, null, 2)}`)
		diagramStore.setErrorMessage(error, TEST_ID);
	}
}

/**
 * Resets the contract storage value to its initial state.
 * 
 * @async
 * @returns {Promise<void>}
 */
const reset = async (): Promise<void> => {
	const diagramStore = useDiagramStore();

	const walletStore = useWalletStore();
	const Tezos = walletStore.getTezos;

	try {
		diagramStore.setProgress('get-contract', 'running', TEST_ID);
		const contract = await Tezos.wallet.at(CONTRACT_ADDRESS);
		diagramStore.setProgress('execute-operation', 'running', TEST_ID);
		const operation = await contract.methodsObject.reset().send();
		diagramStore.setProgress('wait-confirmation', 'running', TEST_ID);
		const confirmation = await operation.confirmation(3);
		if (confirmation?.block.hash) diagramStore.setOperationHash(confirmation?.block.hash, TEST_ID);
		diagramStore.setProgress('success', 'completed', TEST_ID);

	} catch (error) {
		console.log(`Error: ${JSON.stringify(error, null, 2)}`)
		diagramStore.setErrorMessage(error, TEST_ID);
	}
}

/**
 * Fetches and logs the current storage value of the contract.
 * 
 * @async
 * @returns {Promise<void>}
 */
const getContractStorage = async (): Promise<void> => {
	const diagramStore = useDiagramStore();

	const walletStore = useWalletStore();
	const Tezos = walletStore.getTezos;

	try {
		diagramStore.setProgress('get-contract', 'running', TEST_ID);

		const contract = await Tezos.wallet.at(CONTRACT_ADDRESS);
		const storage = await contract.storage();
		console.log(`Current storage value: ${storage}`);
		diagramStore.setProgress('success', 'completed', TEST_ID);

	} catch (error) {
		console.log(`Error: ${error}`)
		diagramStore.setErrorMessage(error, TEST_ID);
	}

	return;
}

/**
 * Fetches and logs the available contract methods.
 * 
 * @async
 * @returns {Promise<void>}
 */
const getContractMethods = async (): Promise<void> => {
	const diagramStore = useDiagramStore();

	const walletStore = useWalletStore();
	const Tezos = walletStore.getTezos;

	try {
		// Set progress: Getting contract
		diagramStore.setProgress('get-contract', 'running', TEST_ID);

		await Tezos.wallet
			.at(CONTRACT_ADDRESS)
			.then((c) => {
				const methods = c.parameterSchema.ExtractSignatures();
				console.log(JSON.stringify(methods, null, 2));
				diagramStore.setProgress('success', 'completed', TEST_ID);
			})
			.catch((error) => {
				console.log(`Error: ${error}`)
			});
	} catch (error) {
		console.log(`Error: ${error}`)
		diagramStore.setErrorMessage(error, TEST_ID);
	}

	return;
}

export { increment, decrement, reset, getContractStorage, getContractMethods }