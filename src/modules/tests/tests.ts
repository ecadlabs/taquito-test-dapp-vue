import type { TestDiagram, TestMetadata } from "@/modules/tests/test";
import { NetworkType } from "@airgap/beacon-types";
import {
  ArrowRightLeft,
  ArrowUp10,
  Calculator,
  Coins,
  Eye,
  EyeOff,
  FileText,
  Globe,
  InfinityIcon,
  Info,
  Network,
  Package,
  Parentheses,
  Plus,
  Shield,
  Users,
  X,
  Zap,
} from "lucide-vue-next";

export const AvailableTests: Record<string, TestMetadata> = {
  transfer: {
    id: "transfer",
    title: "Transfer Tez",
    description:
      "In Tezos, a transfer operation transfers tokens between two addresses. The transfer of tokens from a KT1 account is completed by calling the KT1's smart contract do method. The do method takes a lambda function, and it's the logic of this function that causes the desired transfer of tokens to happen.",
    category: "Core Operations",
    setup: [
      "Install and configure Taquito: `npm install @taquito/taquito`",
      "Set up a Tezos wallet (Temple, Kukai, or other supported wallet)",
      "Use a faucet to fund your wallet with testnet Tez from https://teztnets.com/",
    ],
    relatedTests: ["estimate-fees", "batch", "counter-contract"],
    documentation: {
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/transfer",
      taquitoDocumentation: "https://taquito.io/docs/making_transfers",
      tezosDocumentation:
        "https://octez.tezos.com/docs/seoul/token_management.html",
    },
    component: () => import("@/modules/tests/tests/transfer/transfer-tez.vue"),
    icon: ArrowRightLeft,
    diagrams: {
      transfer: {
        nodes: [
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
    description: `Taquito allows developers to interact with Smart Contracts in a similar manner to standard Javascript objects.

      The "Machine Language" of Tezos Smart Contracts is called Michelson. Michelson is a stack-based language that is human-readable. It's possible to author Smart-Contracts directly in Michelson, however, developers can opt to use high level languages (such as Ligo or SmartPy) to write smart contracts instead.

      Michelson is a specialized language that isn't typical in Javascript or Typescript development contexts. Taquito helps to bridge the gap between the Tezos blockchain and a standard Javascript or Typescript development environment.
    `,
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
    documentation: {
      contract: [
        {
          name: "Counter Contract Source",
          url: "https://github.com/ecadlabs/taquito-test-dapp-vue/blob/main/src/contracts/uncompiled/counter.jsligo",
        },
      ],
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/counter",
      taquitoDocumentation: "https://taquito.io/docs/smartcontracts",
      tezosDocumentation:
        "https://octez.tezos.com/docs/seoul/accounts.html#smart-contracts",
    },
    component: () =>
      import("@/modules/tests/tests/counter/counter-contract.vue"),
    icon: ArrowUp10,
    diagrams: {
      increment: {
        nodes: [
          {
            id: "get-contract",
            label: "Get Contract",
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
    description: `Increase Paid Storage is an operation that enables a payer to increase the paid storage of a smart contract by a certain byte amount.

    This helps resolve an issue where several operations on the same contract would fail when they are added at the same level due to the storage limit being lower than the 'paid_storage_size_diff'.`,
    category: "Smart Contracts",
    setup: [
      "Install Taquito: `npm install @taquito/taquito`",
      "Set up a Tezos wallet with sufficient Tez for storage fees",
      "Deploy a smart contract and keep track of the contract address",
      "Configure Taquito with RPC endpoint and signer",
    ],
    relatedTests: ["counter-contract", "estimate-fees", "transaction-limit"],
    documentation: {
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/increase-paid-storage",
      taquitoDocumentation: "https://taquito.io/docs/increase_paid_storage",
      tezosDocumentation:
        "https://octez.tezos.com/docs/alpha/blocks_ops.html#manager-operations",
    },
    component: () =>
      import("@/modules/tests/tests/increase-paid-storage/increase-paid-storage.vue"),
    icon: Plus,
    diagrams: {
      increase: {
        nodes: [
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
    description: `Taquito's estimate method can be used to estimate fees, gas, and storage associated with an operation.

      An estimate has the following properties:
      - burnFeeMutez: The number of mutez that will be burned for the storage of the operation. Type: number
      - gasLimit: The limit on the amount of gas a given operation can consume. Type: number
      - minimalFeeMutez: Minimum fees for the operation according to baker defaults. Type: number
      - storageLimit: The limit on the amount of storage an operation can use. Type: number
      - suggestedFeeMutez: The suggested fee for the operation, including minimal fees and a small buffer. Type: number
      - totalCost: The sum of minimalFeeMutez and burnFeeMutez. Type: number
      - usingBaseFeeMutez: Fees according to your specified base fee, ensuring at least minimum fees are used. Type: number
      `,
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
    documentation: {
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/estimate-fees",
      taquitoDocumentation: "https://taquito.io/docs/estimate",
    },
    component: () =>
      import("@/modules/tests/tests/estimate-fees/estimate-fees.vue"),
    icon: Calculator,
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
    description: `Delegation is when you give your baking rights to another person (baker). This mechanism in Tezos allows users to participate in staking and receive Tezos rewards without running their own node.

    In Tezos, a delegation operation will set the delegate of an address. Calling the KT1's smart contract do method is required to set the delegate for a KT1 account. The do method takes a lambda function, and it is the logic of this function that causes the desired delegation to happen.`,
    category: "Staking & Consensus",
    setup: [
      "Install Taquito: `npm install @taquito/taquito`",
      "Set up a Tezos wallet with sufficient Tez",
      "Identify a trusted baker address for delegation",
      "Configure Taquito with RPC endpoint and signer",
    ],
    relatedTests: ["staking", "transfer", "estimate-fees"],
    documentation: {
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/delegation",
      taquitoDocumentation: "https://taquito.io/docs/set_delegate",
      tezosDocumentation:
        "https://octez.tezos.com/docs/seoul/baking_power.html#delegate-delegators-stakers",
    },
    component: () => import("@/modules/tests/tests/delegation/delegation.vue"),
    icon: Users,
    diagrams: {
      "set-delegate": {
        nodes: [
          {
            id: "wait-for-user",
            label: "Wait for User Confirmation",
          },
          {
            id: "set-delegate",
            label: "Set Delegate",
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
            id: "wait-for-user",
            label: "Wait for User Confirmation",
          },
          {
            id: "remove-delegation",
            label: "Remove Delegation",
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
    description: `Staking is an update to the "Proof of Stake" Mechanism in Tezos.

Staking allows any user to participate in the "Proof of Stake" mechanism without setting up a baker. Users can stake their tokens to their delegates, and their staked tokens will be subject to slashing in case of delegate/baker's misbehaviour. This allows the total amount of staked Tez to be much higher than the amount of Tez that bakers themselves hold, which in turn increases the security of the network.

Users can control their staked funds using the 'stake', 'unstake', and 'finalize_unstake' operations. These are implemented as pseudo-entrypoints, and the parameters are passed to a transfer operation with the same destination as the sender.`,
    category: "Staking & Consensus",
    setup: [
      "Install Taquito: `npm install @taquito/taquito`",
      "Set up a Tezos wallet with sufficient Tez for staking",
      "Configure Taquito with RPC endpoint and signer",
    ],
    relatedTests: ["delegation", "counter-contract", "estimate-fees"],
    documentation: {
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/staking",
      taquitoDocumentation: "https://taquito.io/docs/staking",
      tezosDocumentation:
        "https://octez.tezos.com/docs/seoul/baking_power.html#delegate-delegators-stakers",
    },
    component: () => import("@/modules/tests/tests/staking/staking.vue"),
    icon: Coins,
    diagrams: {
      stake: {
        nodes: [
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
    description: `Each Tezos account holds a counter that increments every time an operation is included in a block on the network. This feature prevents users from sending two or multiple transactions in a row.

      A batch operation is used to group multiple operations together, avoiding this restriction.

      That being said, the limitations of batched operations are similar to the constraints of single processes. For example, the gas limit of the Tezos blockchain limits the number of functions that can batch together. In addition to that, only a single account can sign batched operations.
      `,
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
    documentation: {
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/batch",
      taquitoDocumentation: "https://taquito.io/docs/batch_API/",
      tezosDocumentation:
        "https://octez.tezos.com/docs/seoul/blocks_ops.html#manager-operation-batches",
    },
    component: () => import("@/modules/tests/tests/batch/batch.vue"),
    icon: Package,
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
    description: `Signing arbitrary chunks of data is a common practice in a blockchain environment and is usually done to prove that a user has access to a certain account or that a message comes from a certain account.

A signature is a string that is usually based58 encoded for better readability and starts with 'edsig'. It requires a signer to hash the input bytes and thus can only be done if the signer has access to the private key of the account. Therefore, it is impossible to forge a signature for an account of which you don't have access to the private key.

Michelson implements an instruction called 'CHECK_SIGNATURE' that allows it to retrieve the public key of the account that created the signature.
      `,
    category: "Cryptography & Security",
    setup: [
      "Install Taquito: `npm install @taquito/taquito`",
      "Set up a Tezos wallet with signing capabilities",
      "Configure Taquito with wallet provider or signer",
      "Understand the data you want to sign and its format",
    ],
    relatedTests: ["counter-contract", "estimate-fees"],
    documentation: {
      contract: [
        {
          name: "Verification Contract Source",
          url: "https://github.com/ecadlabs/taquito-test-dapp-vue/blob/main/src/contracts/uncompiled/signature.jsligo",
        },
      ],
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/sign-payload",
      taquitoDocumentation: "https://taquito.io/docs/signing/",
    },
    component: () =>
      import("@/modules/tests/tests/sign-payload/sign-payload.vue"),
    icon: Shield,
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
    description: `Developers may wish to set themselves the different limits of a transaction before broadcasting it. This is useful in cases such as when you want to give it a better chance to be included first or to prevent the transaction from being backtracked due to an insufficient storage limit.`,
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
    documentation: {
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/transaction-limit",
      taquitoDocumentation: "https://taquito.io/docs/transaction_limits/",
    },
    component: () =>
      import("@/modules/tests/tests/transaction-limit/transaction-limit.vue"),
    icon: InfinityIcon,
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
    description: `There are use cases for allowing users to sign arbitrary data. It is important to ensure that data cannot be injected into the blockchain. The failing_noop (no-op) operation can wrap arbitrary data and is guaranteed to fail.`,
    category: "Smart Contracts",

    setup: [
      "Install Taquito: `npm install @taquito/taquito`",
      "Set up a Tezos wallet with sufficient Tez for gas fees",
      "Configure Taquito with RPC endpoint and signer",
    ],
    relatedTests: ["counter-contract", "transaction-limit", "estimate-fees"],
    documentation: {
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/failing-noop",
      taquitoDocumentation: "https://taquito.io/docs/failing_noop/",
      tezosDocumentation:
        "https://octez.tezos.com/docs/seoul/blocks_ops.html#failing-noop-operation",
    },
    component: () =>
      import("@/modules/tests/tests/failing-noop/failing-noop.vue"),
    icon: X,
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
  "failing-contract": {
    id: "failing-contract",
    title: "Contract Call Failures",
    description: `This test demonstrates how Taquito handles various contract call failure scenarios. Understanding error modes is crucial for building robust dApps that can gracefully handle different types of contract interaction failures.

    Different types of errors include parameter type mismatches, invalid entrypoint calls, and malformed parameter structures.`,
    category: "Smart Contracts",
    setup: [
      "Install Taquito: `npm install @taquito/taquito`",
      "Set up a Tezos wallet with sufficient Tez for gas fees",
      "Deploy or obtain access to a contract with entry points",
      "Configure Taquito with RPC endpoint and signer",
      "Understand the contract's entrypoints and expected parameters",
    ],
    relatedTests: ["counter-contract", "failing-noop", "estimate-fees"],
    documentation: {
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/failing-contract",
      taquitoDocumentation: "https://taquito.io/docs/smartcontracts",
      tezosDocumentation:
        "https://octez.tezos.com/docs/seoul/accounts.html#smart-contracts",
    },
    component: () =>
      import("@/modules/tests/tests/failing-contract/failing-contract.vue"),
    icon: X,
    diagrams: {
      "failing-contract": {
        nodes: [
          {
            id: "get-contract",
            label: "Get Contract",
          },
          {
            id: "execute-operation",
            label: "Execute Operation",
          },
          {
            id: "wait-confirmation",
            label: "Wait for Confirmation",
          },
        ],
      },
    },
  },
  "global-constants": {
    id: "global-constants",
    title: "Global Constants",
    description: `Global Constants allow users to register Michelson expressions in a global table and reference them across multiple contracts. This feature helps reduce contract size and storage costs by enabling code reuse.

    This is particularly useful for large contracts that exceed size limits or when sharing common code patterns between multiple contracts.`,
    category: "Advanced Operations",
    setup: [
      "Install Taquito: `npm install @taquito/taquito`",
      "Set up a Tezos wallet with sufficient Tez for registration fees",
      "Configure Taquito with RPC endpoint and signer",
      "Understand Michelson expressions and JSON format",
      "Have sample expressions ready for testing",
    ],
    relatedTests: [
      "counter-contract",
      "estimate-fees",
      "batch",
      "sign-payload",
    ],
    documentation: {
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/global-constants",
      taquitoDocumentation: "https://taquito.io/docs/global_constant/",
      tezosDocumentation:
        "https://octez.tezos.com/docs/seoul/global_constants.html",
    },
    component: () =>
      import("@/modules/tests/tests/global-constants/global-constants.vue"),
    icon: Globe,
    diagrams: {
      "register-constant": {
        nodes: [
          {
            id: "register-constant",
            label: "Register Global Constant",
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
  "complex-parameters": {
    id: "complex-parameters",
    title: "Complex Contract Parameters",
    description: `This test demonstrates how to handle various complex parameter types when interacting with smart contracts. It covers records, nested structures, maps, and sets.`,
    category: "Smart Contracts",
    setup: [
      "Install Taquito: `npm install @taquito/taquito`",
      "Set up a Tezos wallet with sufficient Tez for gas fees",
      "Deploy a contract with complex parameter support",
      "Configure Taquito with RPC endpoint and signer",
      "Understand Michelson data types and their JavaScript equivalents",
    ],
    relatedTests: [
      "counter-contract",
      "estimate-fees",
      "batch",
      "sign-payload",
    ],
    documentation: {
      contract: [
        {
          name: "Complex Parameters Contract Source",
          url: "https://github.com/ecadlabs/taquito-test-dapp-vue/blob/main/src/contracts/uncompiled/complex-parameters.jsligo",
        },
      ],
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/complex-parameters",
      taquitoDocumentation: "https://taquito.io/docs/complex_parameters/",
      tezosDocumentation:
        "https://octez.tezos.com/docs/seoul/michelson.html#data-structures",
    },
    component: () =>
      import("@/modules/tests/tests/complex-parameters/complex-parameters.vue"),
    icon: Parentheses,
    diagrams: {
      "add-record": {
        nodes: [
          {
            id: "get-contract",
            label: "Get Contract",
          },
          {
            id: "execute-operation",
            label: "Execute Add Record",
          },
          {
            id: "wait-confirmation",
            label: "Wait for Confirmation",
          },
        ],
      },
      "set-nested-record": {
        nodes: [
          {
            id: "get-contract",
            label: "Get Contract",
          },
          {
            id: "execute-operation",
            label: "Execute Set Nested Record",
          },
          {
            id: "wait-confirmation",
            label: "Wait for Confirmation",
          },
        ],
      },
      "manage-user-set": {
        nodes: [
          {
            id: "get-contract",
            label: "Get Contract",
          },
          {
            id: "execute-operation",
            label: "Execute Set Operation",
          },
          {
            id: "wait-confirmation",
            label: "Wait for Confirmation",
          },
        ],
      },
      "update-metadata": {
        nodes: [
          {
            id: "get-contract",
            label: "Get Contract",
          },
          {
            id: "execute-operation",
            label: "Execute Update Metadata",
          },
          {
            id: "wait-confirmation",
            label: "Wait for Confirmation",
          },
        ],
      },
      "get-user-record": {
        noIndexer: true,
        nodes: [
          {
            id: "get-contract",
            label: "Get Contract",
          },
          {
            id: "read-storage",
            label: "Read User Record",
          },
        ],
      },
      "get-nested-data": {
        noIndexer: true,
        nodes: [
          {
            id: "get-contract",
            label: "Get Contract",
          },
          {
            id: "read-storage",
            label: "Read Nested Data",
          },
        ],
      },
      "get-all-metadata": {
        noIndexer: true,
        nodes: [
          {
            id: "get-contract",
            label: "Get Contract",
          },
          {
            id: "read-storage",
            label: "Read Metadata Object",
          },
        ],
      },
    },
  },
  "contract-views": {
    id: "contract-views",
    title: "Contract Views",
    description: `Contract views allow you to execute read-only operations on smart contracts without creating a transaction or paying fees.

    Views read contract storage and potentially call other contracts to compute results. This makes them useful for getting computed values from contracts without modifying blockchain state.`,
    category: "Viewing Data",
    setup: [
      "Install Taquito: `npm install @taquito/taquito @taquito/tzip16`",
      "Set up a Tezos wallet for contract interactions",
      "Deploy contracts with view definitions or use existing ones",
      "Configure Taquito with RPC endpoint",
    ],
    relatedTests: ["tzip16-metadata", "contract-events", "viewing-blocks"],
    documentation: {
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/contract-views",
      contract: [
        {
          name: "Metadata Contract Source",
          url: "https://github.com/ecadlabs/taquito-test-dapp-vue/blob/main/src/contracts/uncompiled/metadata.jsligo",
        },
      ],
      taquitoDocumentation: "https://taquito.io/docs/metadata-tzip16/",
      tezosDocumentation:
        "https://octez.tezos.com/docs/t024/michelson.html#views",
    },
    component: () =>
      import("@/modules/tests/tests/contract-views/contract-views.vue"),
    icon: Eye,
    diagrams: {
      "get-metadata": {
        noIndexer: true,
        nodes: [
          {
            id: "get-contract",
            label: "Get Contract",
          },
          {
            id: "retrieve-metadata",
            label: "Retrieve Metadata",
          },
        ],
      },
      "execute-view": {
        noIndexer: true,
        nodes: [
          {
            id: "setup-contract",
            label: "Setup Contract",
          },
          {
            id: "execute-view",
            label: "Execute View",
          },
        ],
      },
    },
  },
  "tzip16-metadata": {
    id: "tzip16-metadata",
    title: "TZIP-16 Contract Metadata",
    description: `TZIP-16 is a Tezos standard for adding metadata to smart contracts.

    Metadata can be stored on-chain (tezos-storage), off-chain via HTTP(S), or on IPFS. This test allows you to experiment with different contracts and see how their metadata is structured and accessed.`,
    category: "Viewing Data",
    setup: [
      "Install Taquito TZIP-16 package: `npm install @taquito/tzip16`",
      "Set up a Tezos wallet for contract interactions",
      "Deploy contracts with TZIP-16 metadata or use existing ones",
      "Configure Taquito with RPC endpoint",
      "Understand different metadata storage approaches (big_map, URI, JSON)",
    ],
    relatedTests: [
      "contract-views",
      "counter-contract",
      "complex-parameters",
      "sign-payload",
    ],
    documentation: {
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/tzip16-metadata",
      contract: [
        {
          name: "Metadata Contract Source",
          url: "https://github.com/ecadlabs/taquito-test-dapp-vue/blob/main/src/contracts/uncompiled/metadata.jsligo",
        },
        {
          name: "Metadata HTTPS Contract Source",
          url: "https://github.com/ecadlabs/taquito-test-dapp-vue/blob/main/src/contracts/uncompiled/metadata-https.jsligo",
        },
      ],
      taquitoDocumentation: "https://taquito.io/docs/metadata-tzip16/",
      tezosDocumentation: "https://tzip.tezosagora.org/proposal/tzip-16/",
    },
    component: () =>
      import("@/modules/tests/tests/tzip16-metadata/tzip16-metadata.vue"),
    icon: Info,
    diagrams: {
      "get-metadata": {
        noIndexer: true,
        nodes: [
          {
            id: "get-contract",
            label: "Get Contract",
          },
          {
            id: "retrieve-metadata",
            label: "Retrieve Metadata",
          },
        ],
      },
    },
  },
  "fa2-token": {
    id: "fa2-token",
    title: "FA2 Token (TZIP-12)",
    description:
      "Test TZIP-12 (FA2) token standard functionality including token transfers, minting, burning, and balance queries. FA2 is a unified token standard for Tezos that supports fungible, non-fungible, and multi-asset tokens.",
    category: "Token Standards",
    setup: [
      "Install and configure Taquito with TZIP-12 support: `npm install @taquito/taquito @taquito/tzip12`",
      "Deploy an FA2 compliant token contract",
      "Set up a Tezos wallet (Temple, Kukai, or other supported wallet)",
      "Use a faucet to fund your wallet with testnet Tez from https://teztnets.com/",
    ],
    relatedTests: ["tzip16-metadata", "transfer", "counter-contract"],
    documentation: {
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/fa2-token",
      contract: [
        {
          name: "FA2 Token Contract Source",
          url: "https://github.com/ecadlabs/taquito-test-dapp-vue/blob/main/src/contracts/uncompiled/fa2-token.jsligo",
        },
        {
          name: "Balance Callback Contract Source",
          url: "https://github.com/ecadlabs/taquito-test-dapp-vue/blob/main/src/contracts/uncompiled/balance-callback.jsligo",
        },
      ],
      taquitoDocumentation: "https://taquito.io/docs/tzip12/",
      tezosDocumentation:
        "https://gitlab.com/tezos/tzip/-/blob/master/proposals/tzip-12/tzip-12.md",
    },
    component: () => import("@/modules/tests/tests/fa2-token/fa2-token.vue"),
    icon: Coins,
    diagrams: {
      mint: {
        nodes: [
          {
            id: "get-contract",
            label: "Get FA2 Contract",
          },
          {
            id: "execute-operation",
            label: "Execute Mint Operation",
          },
          {
            id: "wait-confirmation",
            label: "Wait for Confirmation",
          },
        ],
      },
      burn: {
        nodes: [
          {
            id: "get-contract",
            label: "Get FA2 Contract",
          },
          {
            id: "execute-operation",
            label: "Execute Burn Operation",
          },
          {
            id: "wait-confirmation",
            label: "Wait for Confirmation",
          },
        ],
      },
      transfer: {
        nodes: [
          {
            id: "get-contract",
            label: "Get FA2 Contract",
          },
          {
            id: "execute-operation",
            label: "Execute Transfer Operation",
          },
          {
            id: "wait-confirmation",
            label: "Wait for Confirmation",
          },
        ],
      },
      "get-balance": {
        noIndexer: true,
        nodes: [
          {
            id: "get-contract",
            label: "Get FA2 Contract",
          },
          {
            id: "read-fa2-storage",
            label: "Read FA2 Contract Storage",
          },
        ],
      },
      "get-balance-with-callback": {
        noIndexer: true,
        nodes: [
          {
            id: "get-contract",
            label: "Get FA2 Contract",
          },
          {
            id: "call-balance-of",
            label: "Call FA2 Balance Function",
          },
          {
            id: "wait-confirmation",
            label: "Wait for Chain Confirmation",
          },
          {
            id: "read-callback-storage",
            label: "Read Callback Storage",
          },
        ],
      },
    },
  },
  "contract-events": {
    id: "contract-events",
    title: "Contract Events",
    description: `Contract events allow smart contracts to emit event-like information to off-chain applications using the EMIT instruction in Michelson.

    This test demonstrates how to subscribe to contract events using Taquito's \`TezosToolkit.stream.subscribeEvent()\`. You can subscribe to specific event tags or all events from a contract, enabling real-time monitoring of contract state changes and operations.`,
    category: "Viewing Data",
    setup: [
      "Install Taquito: `npm install @taquito/taquito`",
      "Set up a Tezos wallet with sufficient Tez for gas fees",
      "Deploy a contract that emits events using EMIT instruction",
    ],
    relatedTests: ["counter-contract", "tzip16-metadata"],
    documentation: {
      contract: [
        {
          name: "Events Contract Source",
          url: "https://github.com/ecadlabs/taquito-test-dapp-vue/blob/main/src/contracts/uncompiled/events-contract.jsligo",
        },
      ],
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/contract-events",
      taquitoDocumentation: "https://taquito.io/docs/subscribe_event/",
      tezosDocumentation: "https://octez.tezos.com/docs/t024/event.html",
    },
    component: () =>
      import("@/modules/tests/tests/contract-events/contract-events.vue"),
    icon: Zap,
    diagrams: {
      "emit-event": {
        nodes: [
          {
            id: "get-contract",
            label: "Get Contract",
          },
          {
            id: "execute-operation",
            label: "Execute Operation",
          },
          {
            id: "wait-confirmation",
            label: "Wait for Confirmation",
          },
        ],
      },
    },
  },
  "viewing-blocks": {
    id: "viewing-blocks",
    title: "Viewing Blocks",
    description: `Block inspection focused on finding transactions within blocks. This test demonstrates how to fetch block data using Taquito's RPC methods and filter for transaction operations. You can view the latest block or fetch any specific block by its number.`,
    category: "Viewing Data",
    setup: [
      "Install Taquito: `npm install @taquito/taquito`",
      "Configure Taquito with RPC endpoint",
      "Understand Tezos block structure and transaction operations",
      "Have access to a Tezos node or public RPC endpoint",
    ],
    relatedTests: ["transfer", "estimate-fees", "tzip16-metadata"],
    documentation: {
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/viewing-blocks",
      taquitoDocumentation: "https://taquito.io/docs/rpc_package/",
      tezosDocumentation: "https://octez.tezos.com/docs/seoul/blocks_ops.html",
    },
    component: () =>
      import("@/modules/tests/tests/viewing-blocks/viewing-blocks.vue"),
    icon: FileText,
    diagrams: {
      "fetch-block": {
        noIndexer: true,
        nodes: [
          {
            id: "fetch-block",
            label: "Fetch Block",
          },
        ],
      },
    },
  },
  "etherlink-bridge": {
    id: "etherlink-bridge",
    title: "Etherlink Bridge",
    description: `Bridge XTZ tokens between Tezos Layer 1 (L1) and Etherlink Layer 2 (L2). 

Etherlink is an EVM-compatible rollup built on Tezos. This test demonstrates how to:
- Deposit XTZ from Tezos L1 to Etherlink L2
- Withdraw XTZ from Etherlink L2 to Tezos L1

The bridge uses Smart Rollup technology to enable cross-layer communication.`,
    category: "Advanced Operations",
    supportedNetworks: [NetworkType.GHOSTNET],
    setup: [
      "Connect to Ghostnet testnet (only network currently supported)",
      "Set up a Tezos wallet with Beacon/WalletConnect/Ledger",
      "Set up an EVM wallet (e.g. MetaMask)",
      "Have sufficient XTZ for gas fees and the amount to transfer",
    ],
    relatedTests: ["transfer", "batch", "transaction-limit"],
    documentation: {
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/etherlink-bridge",
      taquitoDocumentation: "https://taquito.io/docs/smart_rollups/",
      tezosDocumentation: "https://docs.etherlink.com/bridging/bridging-tezos",
    },
    component: () =>
      import("@/modules/tests/tests/etherlink-bridge/etherlink-bridge.vue"),
    icon: Network,
    diagrams: {
      deposit: {
        nodes: [
          {
            id: "get-bridge-contract",
            label: "Get Bridge Contract",
          },
          {
            id: "convert-etherlink-address",
            label: "Convert Etherlink Address",
          },
          {
            id: "estimate-fees",
            label: "Estimate Fees",
          },
          {
            id: "send-deposit-transaction",
            label: "Send Deposit Transaction",
          },
          {
            id: "wait-for-chain-confirmation",
            label: "Wait for Chain Confirmation",
          },
        ],
      },
      withdraw: {
        noIndexer: true,
        nodes: [
          {
            id: "create-signer",
            label: "Create Signer",
          },
          {
            id: "get-withdrawal-contract",
            label: "Get Withdrawal Contract",
          },
          {
            id: "call-withdrawal-contract",
            label: "Call Withdrawal Contract",
          },
          {
            id: "wait-for-chain-confirmation",
            label: "Wait for Chain Confirmation",
          },
        ],
      },
      "withdraw-fast": {
        noIndexer: true,
        nodes: [
          {
            id: "create-signer",
            label: "Create Signer",
          },
          {
            id: "get-fast-withdrawal-contract",
            label: "Get Fast Withdrawal Contract",
          },
          {
            id: "call-fast-withdrawal-contract",
            label: "Call Fast Withdrawal Contract",
          },
          {
            id: "wait-for-chain-confirmation",
            label: "Wait for Chain Confirmation",
          },
        ],
      },
    },
  },
  "tezlink-bridge": {
    id: "tezlink-bridge",
    title: "Tezlink Bridge",
    description: `Bridge XTZ tokens between Tezos L1 and Tezlink.`,
    category: "Advanced Operations",
    supportedNetworks: [NetworkType.SHADOWNET],
    setup: [
      "Connect to Shadownet testnet (only network currently supported)",
      "Set up a Tezos wallet with Beacon/WalletConnect/Ledger",
      "Have sufficient XTZ for gas fees and the amount to transfer",
    ],
    relatedTests: ["transfer", "batch", "transaction-limit"],
    documentation: {
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/tezlink-bridge",
      taquitoDocumentation: "https://taquito.io/docs/smart_rollups/",
    },
    component: () =>
      import("@/modules/tests/tests/tezlink-bridge/tezlink-bridge.vue"),
    icon: Network,
    diagrams: {
      deposit: {
        nodes: [
          {
            id: "pack-tezlink-address",
            label: "Pack Tezlink Address",
          },
          {
            id: "estimate-fees",
            label: "Estimate Fees",
          },
          {
            id: "send-deposit-transaction",
            label: "Send Deposit Transaction",
          },
          {
            id: "wait-for-chain-confirmation",
            label: "Wait for Chain Confirmation",
          },
        ],
      },
    },
  },
  sapling: {
    id: "sapling",
    title: "Sapling Transactions",
    description: `Demonstrates Taquito's Sapling shield operation: moving tez from public to private addresses using zero-knowledge proofs.`,
    category: "Cryptography & Security",
    icon: EyeOff,
    setup: [
      "Install Taquito Sapling package: `npm install @taquito/sapling`",
      "Set up a Tezos wallet (Temple, Kukai, or other supported wallet)",
      "Use a faucet to fund your wallet with testnet Tez",
      "Understand Sapling concepts: spending keys, viewing keys, payment addresses",
    ],
    relatedTests: ["transfer", "sign-payload", "counter-contract"],
    documentation: {
      script:
        "https://github.com/ecadlabs/taquito-test-dapp-vue/tree/main/src/modules/tests/tests/sapling",
      contract: [
        {
          name: "Sapling Contract",
          url: "https://github.com/ecadlabs/taquito-test-dapp-vue/blob/main/src/contracts/michelson/sapling.tz",
        },
      ],
      taquitoDocumentation: "https://taquito.io/docs/sapling",
      tezosDocumentation: "https://tezos.gitlab.io/active/sapling.html",
    },
    component: () => import("@/modules/tests/tests/sapling/sapling.vue"),
    diagrams: {
      shield: {
        nodes: [
          {
            id: "prepare-shield",
            label: "Prepare Shield Transaction",
          },
          {
            id: "call-contract",
            label: "Call Contract",
          },
          {
            id: "wait-for-chain-confirmation",
            label: "Wait for Chain Confirmation",
          },
        ],
      },
      transfer: {
        nodes: [
          {
            id: "prepare-transfer",
            label: "Prepare Private Transfer",
          },
          {
            id: "call-contract",
            label: "Call Contract",
          },
          {
            id: "wait-for-chain-confirmation",
            label: "Wait for Chain Confirmation",
          },
        ],
      },
      unshield: {
        nodes: [
          {
            id: "prepare-unshield",
            label: "Prepare Unshield Transaction",
          },
          {
            id: "call-contract",
            label: "Call Contract",
          },
          {
            id: "wait-for-chain-confirmation",
            label: "Wait for Chain Confirmation",
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
 *
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
