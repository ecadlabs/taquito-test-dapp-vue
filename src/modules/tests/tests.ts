import type { TestMetadata, TestDiagram } from "@/modules/tests/test";

import TransferTez from "@/modules/tests/tests/transfer/transfer-tez.vue";
import CounterContract from "@/modules/tests/tests/counter/counter-contract.vue";
import IncreasePaidStorage from "@/modules/tests/tests/increase-paid-storage/increase-paid-storage.vue";
import EstimateFees from "@/modules/tests/tests/estimate-fees/estimate-fees.vue";
import Delegation from "@/modules/tests/tests/delegation/delegation.vue";
import Staking from "@/modules/tests/tests/staking/staking.vue";
import Batch from "@/modules/tests/tests/batch/batch.vue";
import SignPayload from "@/modules/tests/tests/sign-payload/sign-payload.vue";

export const AvailableTests: Record<string, TestMetadata> = {
  transfer: {
    id: "transfer",
    title: "Transfer TEZ Between Addresses",
    description: "Transferring a small amount of TEZ betwen two addresses.",
    category: "Transactions",
    learningGoals: [
      "Understand how to create and send transactions",
      "Learn about transaction parameters and fees",
      "Handle transaction confirmation and errors",
    ],
    prerequisites: [
      "Basic understanding of Tezos wallet addresses",
      "Familiarity with Promises/Async functions in JavaScript",
    ],
    setup: [
      "Set up a Tezos wallet and fund it with some TEZ",
      "Connect your wallet to Taquito Playground",
    ],
    relatedTests: ["counter-contract"],
    sourceCode: {
      script: "https://example.com",
      documentation: "https://taquito.io/docs/making_transfers",
    },
    component: TransferTez,
    diagrams: {
      transfer: {
        nodes: [
          {
            id: "estimate-fees",
            label: "Estimate Fees",
          },
          {
            id: "wait-for-user",
            label: "Wait for User Confirmation",
          },
          {
            id: "wait-for-chain-confirmation",
            label: "Wait for Chain Confirmation",
          },
        ],
      },
    },
  },
  "counter-contract": {
    id: "counter-contract",
    title: "Counter Smart Contract",
    description:
      "Interact with a simple counter smart contract that contains a few basic methods.",
    category: "Smart Contracts",
    learningGoals: [
      "Understand smart contract interaction patterns",
      "Learn about contract storage and methods",
      "Handle contract call responses and errors",
    ],
    prerequisites: [
      "Basic understanding of smart contracts",
      "Familiarity with Promises/Async functions in JavaScript",
    ],
    setup: [
      "Set up a Tezos wallet and fund it with some TEZ",
      "Connect your wallet to Taquito Playground",
    ],
    relatedTests: ["transfer"],
    sourceCode: {
      contract: "https://example.com",
      script: "https://example.com",
      documentation: "https://taquito.io/docs/smartcontracts",
    },
    component: CounterContract,
    diagrams: {
      increment: {
        nodes: [
          {
            id: "get-contract",
            label: "Get Contract",
          },
          {
            id: "estimate-fees",
            label: "Estimate Fees",
          },
          {
            id: "execute-operation",
            label: "Execute Increment",
          },
          {
            id: "wait-confirmation",
            label: "Wait for Confirmation",
          },
        ],
      },
      decrement: {
        nodes: [
          {
            id: "get-contract",
            label: "Get Contract",
          },
          {
            id: "estimate-fees",
            label: "Estimate Fees",
          },
          {
            id: "execute-operation",
            label: "Execute Decrement",
          },
          {
            id: "wait-confirmation",
            label: "Wait for Confirmation",
          },
        ],
      },
      reset: {
        nodes: [
          {
            id: "get-contract",
            label: "Get Contract",
          },
          {
            id: "estimate-fees",
            label: "Estimate Fees",
          },
          {
            id: "execute-operation",
            label: "Execute Reset",
          },
          {
            id: "wait-confirmation",
            label: "Wait for Confirmation",
          },
        ],
      },
      "get-storage": {
        noIndexer: true,
        nodes: [
          {
            id: "get-contract",
            label: "Get Contract",
          },
          {
            id: "read-storage",
            label: "Read Storage",
          },
        ],
      },
    },
  },
  "increase-paid-storage": {
    id: "increase-paid-storage",
    title: "Increasing Paid Storage",
    description: "Paying a fee to increase the storage of a smart contract.",
    category: "Smart Contracts",
    learningGoals: [
      "Understand how to increase the paid storage of a smart contract",
      "Learn about the storage of a smart contract",
    ],
    prerequisites: [
      "Basic understanding of smart contracts",
      "Familiarity with Promises/Async functions in JavaScript",
    ],
    setup: [
      "Set up a Tezos wallet and fund it with some TEZ",
      "Connect your wallet to Taquito Playground",
      "Obtain the contract address of a smart contract",
    ],
    relatedTests: ["counter-contract"],
    sourceCode: {
      contract: "https://example.com",
      script: "https://example.com",
      documentation: "https://taquito.io/docs/increase_paid_storage",
    },
    component: IncreasePaidStorage,
    diagrams: {
      increase: {
        nodes: [
          {
            id: "estimate-fees",
            label: "Estimate Fees",
          },
          {
            id: "wait-for-user",
            label: "Wait for User Confirmation",
          },
          {
            id: "wait-for-chain-confirmation",
            label: "Wait for Chain Confirmation",
          },
        ],
      },
    },
  },
  "estimate-fees": {
    id: "estimate-fees",
    title: "Estimating Fees",
    description: "Estimating transaction fees before sending the transaction.",
    category: "Transactions",
    learningGoals: [
      "Understand how to get the transaction fees of a transaction before its sent or confirmed.",
      "Learn about the fees for Tezos transactions.",
    ],
    prerequisites: [
      "Basic understanding of smart contracts",
      "Familiarity with Promises/Async functions in JavaScript",
    ],
    setup: [
      "Set up a Tezos wallet and fund it with some TEZ",
      "Connect your wallet to Taquito Playground",
    ],
    relatedTests: ["transfer-tez"],
    sourceCode: {
      contract: "https://example.com",
      script: "https://example.com",
      documentation: "https://taquito.io/docs/estimate",
    },
    component: EstimateFees,
    diagrams: {
      "estimate-fees": {
        noIndexer: true,
        nodes: [
          {
            id: "estimate-fees",
            label: "Estimate Fees",
          },
        ],
      },
    },
  },
  delegation: {
    id: "delegation",
    title: "Delegation",
    description: "Delegating baking rights to another person.",
    category: "Earning Rewards",
    learningGoals: ["...", "..."],
    prerequisites: ["...", "..."],
    setup: [
      "Set up a Tezos wallet and fund it with some TEZ",
      "Connect your wallet to Taquito Playground",
    ],
    relatedTests: [],
    sourceCode: {
      contract: "https://example.com",
      script: "https://example.com",
      documentation: "https://taquito.io/docs/set_delegate",
    },
    component: Delegation,
    diagrams: {
      "set-delegate": {
        nodes: [
          {
            id: "estimate-fees",
            label: "Estimate Fees",
          },
          {
            id: "set-delegate",
            label: "Set Delegate",
          },
          {
            id: "wait-for-user",
            label: "Wait for User Confirmation",
          },
          {
            id: "wait-for-chain-confirmation",
            label: "Wait for Chain Confirmation",
          },
        ],
      },
      "remove-delegation": {
        nodes: [
          {
            id: "estimate-fees",
            label: "Estimate Fees",
          },
          {
            id: "remove-delegation",
            label: "Remove Delegation",
          },
          {
            id: "wait-for-user",
            label: "Wait for User Confirmation",
          },
          {
            id: "wait-for-chain-confirmation",
            label: "Wait for Chain Confirmation",
          },
        ],
      },
    },
  },
  staking: {
    id: "staking",
    title: "Staking Tokens",
    description: "Stake your tokens to a delegator.",
    category: "Earning Rewards",
    learningGoals: ["...", "..."],
    prerequisites: ["...", "..."],
    setup: [
      "Set up a Tezos wallet and fund it with some TEZ",
      "Connect your wallet to Taquito Playground",
    ],
    relatedTests: [],
    sourceCode: {
      contract: "https://example.com",
      script: "https://example.com",
      documentation: "https://taquito.io/docs/staking",
    },
    component: Staking,
    diagrams: {
      stake: {
        nodes: [
          {
            id: "estimate-fees",
            label: "Estimate Fees",
          },
          {
            id: "stake",
            label: "Stake Funds",
          },
          {
            id: "wait-for-user",
            label: "Wait for User Confirmation",
          },
          {
            id: "wait-for-chain-confirmation",
            label: "Wait for Chain Confirmation",
          },
        ],
      },
      unstake: {
        nodes: [
          {
            id: "estimate-fees",
            label: "Estimate Fees",
          },
          {
            id: "unstake",
            label: "Unstake Funds",
          },
          {
            id: "wait-for-user",
            label: "Wait for User Confirmation",
          },
          {
            id: "wait-for-chain-confirmation",
            label: "Wait for Chain Confirmation",
          },
        ],
      },
      "finalize-unstake": {
        nodes: [
          {
            id: "estimate-fees",
            label: "Estimate Fees",
          },
          {
            id: "finalize-unstake",
            label: "Finalize Unstake",
          },
          {
            id: "wait-for-user",
            label: "Wait for User Confirmation",
          },
          {
            id: "wait-for-chain-confirmation",
            label: "Wait for Chain Confirmation",
          },
        ],
      },
    },
  },
  batch: {
    id: "batch",
    title: "Batching Operations",
    description: "Batching multiple operations together.",
    category: "Other",
    learningGoals: [
      "Understand how to batch multiple operations together",
      "Learn about the benefits of batching operations",
      "Handle batch operation confirmation and errors",
    ],
    prerequisites: [
      "Basic understanding of Tezos wallet addresses",
      "Familiarity with Promises/Async functions in JavaScript",
    ],
    setup: [
      "Set up a Tezos wallet and fund it with some TEZ",
      "Connect your wallet to Taquito Playground",
    ],
    relatedTests: [],
    sourceCode: {
      script: "https://example.com",
      documentation: "https://taquito.io/docs/batch_API/",
    },
    component: Batch,
    diagrams: {
      batch: {
        nodes: [
          {
            id: "create-batch",
            label: "Create Batch",
          },
          {
            id: "add-operations",
            label: "Add Operations to Batch",
          },
          {
            id: "wait-for-user",
            label: "Wait for User Confirmation",
          },
          {
            id: "wait-for-chain-confirmation",
            label: "Wait for Chain Confirmation",
          },
        ],
      },
    },
  },
  "sign-payload": {
    id: "sign-payload",
    title: "Signing Data",
    description: "Signing a payload.",
    category: "Other",
    learningGoals: ["Understand how to sign payloads"],
    prerequisites: [
      "Basic understanding of Tezos wallet addresses",
      "Familiarity with Promises/Async functions in JavaScript",
    ],
    setup: [
      "Set up a Tezos wallet and fund it with some TEZ",
      "Connect your wallet to Taquito Playground",
    ],
    relatedTests: [],
    sourceCode: {
      script: "https://example.com",
      documentation: "https://taquito.io/docs/signing/",
    },
    component: SignPayload,
    diagrams: {
      sign: {
        noIndexer: true,
        nodes: [
          {
            id: "join-payload",
            label: "Join Payload",
          },
          {
            id: "convert-to-bytes",
            label: "Convert to Bytes",
          },
          {
            id: "request-wallet-sign",
            label: "Request Wallet Sign",
          },
          {
            id: "wait-for-user",
            label: "Wait for User Confirmation",
          },
          {
            id: "verify-signature",
            label: "Verify Signature",
          },
        ],
      },
      signMichelson: {
        noIndexer: true,
        nodes: [
          {
            id: "parse-micheline-expression",
            label: "Parse Micheline Expression",
          },
          {
            id: "pack-data-bytes",
            label: "Pack Data Bytes",
          },
          {
            id: "join-payload",
            label: "Join Payload",
          },
          {
            id: "convert-to-bytes",
            label: "Convert to Bytes",
          },
          {
            id: "request-wallet-sign",
            label: "Request Wallet Sign",
          },
          {
            id: "wait-for-user",
            label: "Wait for User Confirmation",
          },
          {
            id: "verify-signature",
            label: "Verify Signature",
          },
        ],
      },
    },
  },
};

export const getTestById = (id: string): TestMetadata | undefined => {
  return AvailableTests[id];
};

export const getTestsByCategory = (category: string): TestMetadata[] => {
  return Object.values(AvailableTests).filter(
    (test) => test.category === category,
  );
};

export const getAllCategories = (): string[] => {
  return [
    ...new Set(Object.values(AvailableTests).map((test) => test.category)),
  ];
};

/**
 * Get a diagram for a test, supporting both single and multiple diagrams
 * @param testId - The test ID
 * @param diagramKey - Optional diagram key for multi-diagram tests
 * @returns The diagram or undefined if not found
 */
export const getTestDiagram = (
  testId: string,
  diagramKey?: string,
): TestDiagram | undefined => {
  const test = getTestById(testId);
  if (!test) return undefined;

  // If diagramKey is provided and test has multiple diagrams
  if (diagramKey && test.diagrams) {
    return test.diagrams[diagramKey];
  }

  // If no diagramKey but test has multiple diagrams, return the first one
  if (test.diagrams && Object.keys(test.diagrams).length > 0) {
    const firstKey = Object.keys(test.diagrams)[0];
    return test.diagrams[firstKey];
  }

  // Return single diagram if available
  return test.diagrams?.[Object.keys(test.diagrams)[0]];
};
