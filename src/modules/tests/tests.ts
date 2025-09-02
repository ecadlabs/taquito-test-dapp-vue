import type { TestMetadata, TestDiagram } from "@/modules/tests/test";

export const AvailableTests: Record<string, TestMetadata> = {
  transfer: {
    id: "transfer",
    title: "Transfer Tez Between Addresses",
    description:
      "Learn how to transfer Tez tokens between Tezos addresses using Taquito's Wallet API. This fundamental operation demonstrates the core transaction flow including fee estimation, user confirmation, and blockchain confirmation.",
    category: "Core Operations",
    setup: [
      "Install and configure Taquito: `npm install @taquito/taquito`",
      "Set up a Tezos wallet (Temple, Kukai, or other supported wallet)",
      "Use a faucet to fund your wallet with testnet Tez from https://teztnets.com/",
    ],
    relatedTests: ["estimate-fees", "batch", "counter-contract"],
    sourceCode: {
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/transfer",
      documentation: "https://taquito.io/docs/making_transfers",
    },
    component: () => import("@/modules/tests/tests/transfer/transfer-tez.vue"),
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
      "Interact with a deployed counter smart contract to understand smart contract interaction patterns. Learn how to call contract methods, read storage, and handle contract operations using Taquito.",
    category: "Smart Contracts",
    setup: [
      "Install Taquito: `npm install @taquito/taquito`",
      "Set up a Tezos wallet with sufficient Tez for gas fees",
      "Deploy or obtain access to a counter contract (KT1 address)",
      "Configure Taquito with RPC endpoint and signer",
      "Understand the contract's entrypoints: increment, decrement, reset, get_storage",
    ],
    relatedTests: [
      "transfer",
      "estimate-fees",
      "transaction-limit",
      "increase-paid-storage",
    ],
    sourceCode: {
      contract:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/blob/main/src/contracts/counter.jsligo",
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/counter",
      documentation: "https://taquito.io/docs/smartcontracts",
    },
    component: () =>
      import("@/modules/tests/tests/counter/counter-contract.vue"),
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
    description:
      "Learn how to increase the paid storage allocation for smart contracts on Tezos. This operation allows you to expand a contract's storage capacity by paying additional fees.",
    category: "Smart Contracts",
    setup: [
      "Install Taquito: `npm install @taquito/taquito`",
      "Set up a Tezos wallet with sufficient Tez for storage fees",
      "Deploy a smart contract and keep track of the contract address",
      "Configure Taquito with RPC endpoint and signer",
    ],
    relatedTests: ["counter-contract", "estimate-fees", "transaction-limit"],
    sourceCode: {
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/increase-paid-storage",
      documentation: "https://taquito.io/docs/increase_paid_storage",
    },
    component: () =>
      import(
        "@/modules/tests/tests/increase-paid-storage/increase-paid-storage.vue"
      ),
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
    description:
      "Learn to estimate transaction fees, gas limits, and storage costs before executing operations.",
    category: "Core Operations",

    setup: [
      "Install Taquito: `npm install @taquito/taquito`",
      "Configure Taquito with RPC endpoint",
      "Set up a wallet or signer for operation simulation",
      "Understand the operation you want to estimate (transfer, contract call, etc.)",
      "Have target addresses or contract addresses ready",
    ],
    relatedTests: [
      "transfer",
      "counter-contract",
      "transaction-limit",
      "batch",
    ],
    sourceCode: {
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/estimate-fees",
      documentation: "https://taquito.io/docs/estimate",
    },
    component: () =>
      import("@/modules/tests/tests/estimate-fees/estimate-fees.vue"),
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
    description:
      "Learn to delegate your baking rights to another baker or remove delegation. Delegation allows you to participate in Tezos consensus and earn rewards without running your own baker infrastructure.",
    category: "Staking & Consensus",
    setup: [
      "Install Taquito: `npm install @taquito/taquito`",
      "Set up a Tezos wallet with sufficient Tez",
      "Identify a trusted baker address for delegation",
      "Configure Taquito with RPC endpoint and signer",
    ],
    relatedTests: ["staking", "transfer", "estimate-fees"],
    sourceCode: {
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/delegation",
      documentation: "https://taquito.io/docs/set_delegate",
    },
    component: () => import("@/modules/tests/tests/delegation/delegation.vue"),
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
    description:
      "Learn about staking operations including staking/unstaking tokens and finalizing unstaking operations.",
    category: "Staking & Consensus",
    setup: [
      "Install Taquito: `npm install @taquito/taquito`",
      "Set up a Tezos wallet with sufficient Tez for staking",
      "Configure Taquito with RPC endpoint and signer",
    ],
    relatedTests: ["delegation", "counter-contract", "estimate-fees"],
    sourceCode: {
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/staking",
      documentation: "https://taquito.io/docs/staking",
    },
    component: () => import("@/modules/tests/tests/staking/staking.vue"),
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
    title: "Batch Operations",
    description:
      "Learn to batch multiple Tezos operations into a single transaction.",
    category: "Advanced Operations",
    setup: [
      "Install Taquito: `npm install @taquito/taquito`",
      "Set up a Tezos wallet with sufficient Tez for batch gas fees",
      "Configure Taquito with RPC endpoint and signer",
      "Identify multiple operations to batch together",
      "Understand operation dependencies and execution order",
    ],
    relatedTests: [
      "transfer",
      "counter-contract",
      "estimate-fees",
      "delegation",
    ],
    sourceCode: {
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/batch",
      documentation: "https://taquito.io/docs/batch_API/",
    },
    component: () => import("@/modules/tests/tests/batch/batch.vue"),
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
    title: "Sign and Verify Payloads",
    description:
      "Learn to sign data payloads using Tezos wallets and verify signatures. This includes signing Micheline expressions, packing data, and verifying signatures.",
    category: "Cryptography & Security",
    setup: [
      "Install Taquito: `npm install @taquito/taquito`",
      "Set up a Tezos wallet with signing capabilities",
      "Configure Taquito with wallet provider or signer",
      "Understand the data you want to sign and its format",
    ],
    relatedTests: ["counter-contract", "estimate-fees"],
    sourceCode: {
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/sign-payload",
      documentation: "https://taquito.io/docs/signing/",
    },
    component: () =>
      import("@/modules/tests/tests/sign-payload/sign-payload.vue"),
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
      "verify-payload-via-contract": {
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
            id: "get-contract",
            label: "Get Contract",
          },
          {
            id: "estimate-fees",
            label: "Estimate Fees",
          },
          {
            id: "wait-for-user",
            label: "Wait for User Confirmation",
          },
          {
            id: "wait-confirmation",
            label: "Wait for Confirmation",
          },
        ],
      },
    },
  },
  "transaction-limit": {
    id: "transaction-limit",
    title: "Transaction Limits",
    description:
      "Learn to set transaction limits for smart contract interactions to control gas consumption and storage costs.",
    category: "Smart Contracts",
    setup: [
      "Install Taquito: `npm install @taquito/taquito`",
      "Set up a Tezos wallet with sufficient Tez for gas fees",
      "Configure Taquito with RPC endpoint and signer",
      "Have a smart contract address ready for interaction",
      "Understand the contract method you want to call and its complexity",
    ],
    relatedTests: [
      "counter-contract",
      "estimate-fees",
      "increase-paid-storage",
    ],
    sourceCode: {
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/transaction-limit",
      documentation: "https://taquito.io/docs/transaction_limits/",
    },
    component: () =>
      import("@/modules/tests/tests/transaction-limit/transaction-limit.vue"),
    diagrams: {
      "set-transaction-limit": {
        nodes: [
          {
            id: "get-contract",
            label: "Get Contract",
          },
          {
            id: "set-transaction-limit",
            label: "Set Transaction Limit",
          },
          {
            id: "execute-operation",
            label: "Execute Operation",
          },
          {
            id: "wait-for-user",
            label: "Wait for User Confirmation",
          },
          {
            id: "wait-chain-confirmation",
            label: "Wait for Chain Confirmation",
          },
        ],
      },
    },
  },
  "failing-noop": {
    id: "failing-noop",
    title: "Failing Noop",
    description:
      "Learn to use the Failing Noop instruction in Tezos to deliberately fail an operation.",
    category: "Smart Contracts",

    setup: [
      "Install Taquito: `npm install @taquito/taquito`",
      "Set up a Tezos wallet with sufficient Tez for gas fees",
      "Configure Taquito with RPC endpoint and signer",
    ],
    relatedTests: ["counter-contract", "transaction-limit", "estimate-fees"],
    sourceCode: {
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/failing-noop",
      documentation: "https://taquito.io/docs/failing_noop/",
    },
    component: () =>
      import("@/modules/tests/tests/failing-noop/failing-noop.vue"),
    diagrams: {
      "failing-noop-operation": {
        noIndexer: true,
        nodes: [
          {
            id: "signing-operation",
            label: "Signing Operation",
          },
          {
            id: "wait-for-user",
            label: "Wait for User Confirmation",
          },
          {
            id: "get-public-key",
            label: "Get Public Key",
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
