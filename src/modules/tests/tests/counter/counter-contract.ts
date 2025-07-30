import { useWalletStore } from "@/stores/walletStore"
const CONTRACT_ADDRESS = 'KT1AoX6862rfFB5F1yxiE6Y8EwTQz8G1WEBb';

const increment = async (amount: number) => {
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

const decrement = async (amount: number) => {
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

const reset = async () => {
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