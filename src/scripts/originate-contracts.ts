import { InMemorySigner } from '@taquito/signer';
import { TezosToolkit } from '@taquito/taquito';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

config();

export const originateContracts = async (): Promise<string> => {
	const rpcUrl = process.env.VITE_RPC_URL;
	const networkType = process.env.VITE_NETWORK_TYPE;

	if (!rpcUrl || !networkType) {
		throw new Error('RPC Url or Network Type could not be read from the env or are empty.')
	}

	console.log(`Using RPC URL: ${rpcUrl}`);
	console.log(`Using network: ${networkType}`);

	const Tezos = new TezosToolkit(rpcUrl);
	const key = process.env.WALLET_PRIVATE_KEY;

	if (!key) {
		throw new ReferenceError('Wallet private key could not be read from the env file.');
	}
	const signer = new InMemorySigner(key);
	Tezos.setProvider({ signer });

	const contractPath = join(process.cwd(), 'src', 'contracts', 'compiled', 'counter.tz');
	const counterCode = readFileSync(contractPath, 'utf8');

	try {
		const originationOp = await Tezos.contract.originate({
			code: counterCode,
			storage: 0,
		});

		console.log(`Waiting for confirmation of origination for ${originationOp.contractAddress}...`);

		await originationOp.contract();
		console.log(`Origination completed. Contract address: ${originationOp.contractAddress}`);

		const contractAddress = originationOp.contractAddress;
		if (!contractAddress) {
			throw new Error('Contract address is undefined after origination');
		}

		const contractConfig = {
			address: contractAddress,
			originatedAt: new Date().toISOString(),
			network: networkType
		};

		const configPath = join(process.cwd(), 'src', 'contracts', 'contract-config.json');
		writeFileSync(configPath, JSON.stringify(contractConfig, null, 2));
		console.log(`Contract configuration saved to: ${configPath}`);

		return contractAddress;
	} catch (error) {
		console.error(`Error originating contract: ${JSON.stringify(error, null, 2)}`);
		throw error;
	}
}

// If running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
	originateContracts()
		.then(address => {
			console.log(`Contract successfully originated at: ${address}`);
			process.exit(0);
		})
		.catch(error => {
			console.error(`Failed to originate contract:`, error);
			process.exit(1);
		});
}