import TransferTez from "@/modules/tests/tests/transfer/transfer-tez.vue";
import CounterContract from "@/modules/tests/tests/counter/counter-contract.vue";
import type { TestMetadata } from '@/modules/tests/test';

export const AvailableTests: Record<string, TestMetadata> = {
	'transfer': {
		id: 'transfer',
		title: 'Transfer TEZ Between Addresses',
		description: 'Transferring a small amount of TEZ betwen two addresses.',
		category: 'Wallet to Wallet Transactions',
		learningGoals: [
			'Understand how to create and send transactions',
			'Learn about transaction parameters and fees',
			'Handle transaction confirmation and errors'
		],
		prerequisites: [
			'Basic understanding of Tezos wallet addresses',
			'Familiarity with Promises/Async functions in JavaScript'
		],
		setup: [
			'Set up a Tezos wallet and fund it with some TEZ',
			'Connect your wallet to Taquito Playground',
		],
		stepByStepNarrative: [
			'Step 1',
			'Step 2',
			'Step 3'
		],
		relatedTests: ['counter-contract'],
		sourceCode: {
			script: 'https://example.com',
			documentation: 'https://taquito.io/docs/making_transfers'
		},
		component: TransferTez,
		diagram: {
			nodes: [
				{
					id: 'start',
					label: 'Start',
					type: 'start',
					next: 'validate-input'
				},
				{
					id: 'validate-input',
					label: 'Validate Input',
					type: 'process',
					next: 'create-transaction'
				},
				{
					id: 'create-transaction',
					label: 'Create Transaction',
					type: 'process',
					next: 'send-transaction'
				},
				{
					id: 'send-transaction',
					label: 'Send Transaction',
					type: 'process',
					next: 'wait-confirmation'
				},
				{
					id: 'wait-confirmation',
					label: 'Wait for Confirmation',
					type: 'process',
				},
			],
		}
	},
	'counter-contract': {
		id: 'counter-contract',
		title: 'Counter Smart Contract',
		description: 'Interact with a simple counter smart contract that contains a few basic methods.',
		category: 'Smart Contracts',
		learningGoals: [
			'Understand smart contract interaction patterns',
			'Learn about contract storage and methods',
			'Handle contract call responses and errors'
		],
		prerequisites: [
			'Basic understanding of smart contracts',
			'Familiarity with Promises/Async functions in JavaScript'
		],
		setup: [
			'Set up a Tezos wallet and fund it with some TEZ',
			'Connect your wallet to Taquito Playground',
		],
		stepByStepNarrative: [
			'Step 1',
			'Step 2',
			'Step 3'
		],
		relatedTests: ['transfer'],
		sourceCode: {
			contract: 'https://example.com',
			script: 'https://example.com',
			documentation: 'https://taquito.io/docs/smartcontracts'
		},
		component: CounterContract,
		diagram: {
			nodes: [
				{
					id: 'start',
					label: 'Start',
					type: 'start',
					next: 'get-contract'
				},
				{
					id: 'get-contract',
					label: 'Get Contract',
					type: 'process',
					next: 'execute-operation'
				},
				{
					id: 'execute-operation',
					label: 'Execute Operation',
					type: 'process',
					next: 'wait-confirmation'
				},
				{
					id: 'wait-confirmation',
					label: 'Wait for Confirmation',
					type: 'process',
				},
			],
		}
	},
	'contract-origination': {
		id: 'contract-origination',
		title: 'Smart Contract Origination',
		description: 'Deploying a test contract to the blockchain with basic methods and storage.',
		category: 'Smart Contracts',
		learningGoals: [
			'Understand smart contract deployment patterns',
			'Learn about keys and the signing process',
			'Learn about the confirmation process'
		],
		prerequisites: [
			'Basic understanding of smart contracts',
			'Familiarity with Promises/Async functions in JavaScript'
		],
		setup: [
			'Set up a Tezos wallet and fund it with some TEZ',
			'Connect your wallet to Taquito Playground',
			'Obtain your wallet key for signing'
		],
		stepByStepNarrative: [
			'Step 1',
			'Step 2',
			'Step 3'
		],
		relatedTests: ['transfer'],
		sourceCode: {
			contract: 'https://example.com',
			script: 'https://example.com',
			documentation: 'https://taquito.io/docs/originate'
		},
		// component: CounterContract
	},
	// Not fully written yet
	'delegation': {
		id: 'delegation',
		title: 'Baking Delegation',
		description: 'Deploying a test contract to the blockchain with basic methods and storage.',
		category: 'Advanced Features',
		learningGoals: [
			'Understand smart contract deployment patterns',
			'Learn about keys and the signing process',
			'Learn about the confirmation process'
		],
		prerequisites: [
			'Basic understanding of smart contracts',
			'Familiarity with Promises/Async functions in JavaScript'
		],
		setup: [
			'Set up a Tezos wallet and fund it with some TEZ',
			'Connect your wallet to Taquito Playground',
			'Obtain your wallet key for signing'
		],
		stepByStepNarrative: [
			'Step 1',
			'Step 2',
			'Step 3'
		],
		relatedTests: ['transfer'],
		sourceCode: {
			contract: 'https://example.com',
			script: 'https://example.com',
			documentation: 'https://taquito.io/docs/originate'
		},
		// component: CounterContract
	},
	// Not fully written yet
	'staking': {
		id: 'staking',
		title: 'Staking Operations',
		description: 'Deploying a test contract to the blockchain with basic methods and storage.',
		category: 'Advanced Features',
		learningGoals: [
			'Understand smart contract deployment patterns',
			'Learn about keys and the signing process',
			'Learn about the confirmation process'
		],
		prerequisites: [
			'Basic understanding of smart contracts',
			'Familiarity with Promises/Async functions in JavaScript'
		],
		setup: [
			'Set up a Tezos wallet and fund it with some TEZ',
			'Connect your wallet to Taquito Playground',
			'Obtain your wallet key for signing'
		],
		stepByStepNarrative: [
			'Step 1',
			'Step 2',
			'Step 3'
		],
		relatedTests: ['transfer'],
		sourceCode: {
			contract: 'https://example.com',
			script: 'https://example.com',
			documentation: 'https://taquito.io/docs/originate'
		},
		// component: CounterContract
	},
};

export const getTestById = (id: string): TestMetadata | undefined => {
	return AvailableTests[id];
};

export const getTestsByCategory = (category: string): TestMetadata[] => {
	return Object.values(AvailableTests).filter(test => test.category === category);
};

export const getAllCategories = (): string[] => {
	return [...new Set(Object.values(AvailableTests).map(test => test.category))];
};