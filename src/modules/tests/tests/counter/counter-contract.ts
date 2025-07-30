import { useWalletStore } from "@/stores/walletStore"
const CONTRACT_ADDRESS = 'KT1AoX6862rfFB5F1yxiE6Y8EwTQz8G1WEBb';

/**
 * Increments the contract storage value by the specified amount.
 * 
 * @async
 * @param {number} amount - The amount to increment the storage by (must be between 1 and 100 inclusive).
 * @throws {Error} If the amount is not within the valid range.
 * @returns {Promise<void>}
 */
const increment = async (amount: number): Promise<void> => {
	if (amount <= 0 || amount > 100) throw new Error('Incrementation value must be between 1 and 100 inclusive.');

	const walletStore = useWalletStore();
	const Tezos = walletStore.getTezos;

	try {
		const contract = await Tezos.wallet.at(CONTRACT_ADDRESS);
		console.log(`Incrementing storage value by ${amount}...`);

		const operation = await contract.methodsObject.increment(amount).send();

		console.log(`Waiting for ${operation.opHash} to be confirmed...`);
		const operationHash = await operation.confirmation(3);
		console.log(`Operation injected: https://ghost.tzstats.com/${operationHash}`)
	} catch (error) {
		console.log(`Error: ${JSON.stringify(error, null, 2)}`)
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
	if (amount <= 0 || amount > 100) throw new Error('Decrementation value must be between 1 and 100 inclusive.');

	const walletStore = useWalletStore();
	const Tezos = walletStore.getTezos;

	try {
		const contract = await Tezos.wallet.at(CONTRACT_ADDRESS);
		console.log(`Decrementing storage value by ${amount}...`);

		const operation = await contract.methodsObject.decrement(amount).send();

		console.log(`Waiting for ${operation.opHash} to be confirmed...`);
		const operationHash = await operation.confirmation(3);
		console.log(`Operation injected: https://ghost.tzstats.com/${operationHash}`)
	} catch (error) {
		console.log(`Error: ${JSON.stringify(error, null, 2)}`)
	}
}

/**
 * Resets the contract storage value to its initial state.
 * 
 * @async
 * @returns {Promise<void>}
 */
const reset = async (): Promise<void> => {
	const walletStore = useWalletStore();
	const Tezos = walletStore.getTezos;

	try {
		const contract = await Tezos.wallet.at(CONTRACT_ADDRESS);
		console.log(`Resetting storage value`);

		const operation = await contract.methodsObject.reset().send();

		console.log(`Waiting for ${operation.opHash} to be confirmed...`);
		const operationHash = await operation.confirmation(3);
		console.log(`Operation injected: https://ghost.tzstats.com/${operationHash}`)
	} catch (error) {
		console.log(`Error: ${JSON.stringify(error, null, 2)}`)
	}
}

/**
 * Fetches and logs the current storage value of the contract.
 * 
 * @async
 * @returns {Promise<void>}
 */
const getContractStorage = async (): Promise<void> => {
	const walletStore = useWalletStore();
	const Tezos = walletStore.getTezos;

	try {
		const contract = await Tezos.wallet.at(CONTRACT_ADDRESS);
		const storage = await contract.storage();
		console.log(`Current storage value: ${storage}`);
	} catch (error) {
		console.log(`Error: ${error}`)
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
	const walletStore = useWalletStore();
	const Tezos = walletStore.getTezos;

	await Tezos.wallet
		.at(CONTRACT_ADDRESS)
		.then((c) => {
			const methods = c.parameterSchema.ExtractSignatures();
			console.log(JSON.stringify(methods, null, 2));
		})
		.catch((error) => console.log(`Error: ${error}`));

	return;
}

export { increment, decrement, reset, getContractStorage, getContractMethods }