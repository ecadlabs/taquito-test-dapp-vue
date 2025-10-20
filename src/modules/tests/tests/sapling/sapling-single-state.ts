import { singleSaplingStateContract } from "@/contracts/sapling-contracts";
import { RpcClient } from "@taquito/rpc";
import { InMemorySpendingKey, SaplingToolkit } from "@taquito/sapling";
import { RpcReadAdapter, type TezosToolkit } from "@taquito/taquito";
import BigNumber from "bignumber.js";
import * as bip39 from "bip39";

export interface SaplingSingleStateResult {
  contractAddress: string;
  aliceAddress: string;
  bobAddress: string;
  operations: {
    shield: { hash: string; balance: BigNumber };
    transfer: { hash: string; aliceBalance: BigNumber; bobBalance: BigNumber };
    unshield: { hash: string; balance: BigNumber };
  };
}

export async function runSaplingSingleStateTest(
  tezos: TezosToolkit,
  onProgress: (
    step: string,
    status: "pending" | "success" | "error",
    details?: string,
  ) => void,
  existingContractAddress?: string,
): Promise<SaplingSingleStateResult> {
  let contractAddress: string;

  // Use existing contract or deploy a new one
  if (existingContractAddress) {
    onProgress("Using existing contract", "success", existingContractAddress);
    contractAddress = existingContractAddress;
  } else {
    onProgress("Deploying sapling contract", "pending");

    // Deploy contract using wallet API
    const op = await tezos.wallet
      .originate({
        code: singleSaplingStateContract(8),
        init: "Unit",
        balance: "0",
      })
      .send();

    await op.confirmation();
    const contract = await op.contract();
    contractAddress = contract.address;
    onProgress("Deploying sapling contract", "success", contractAddress);

    // CRITICAL: Wait for contract to be fully indexed by RPC node
    // Sapling state queries fail if contract not fully indexed
    onProgress("Waiting for contract indexing", "pending");
    await new Promise((resolve) => setTimeout(resolve, 15000)); // 15 seconds
    onProgress("Waiting for contract indexing", "success", "Contract indexed");
  }

  const saplingContract = await tezos.wallet.at(contractAddress);

  onProgress("Generating spending keys for Alice and Bob", "pending");

  // Generate keys for Alice - using a pre-generated key for consistency
  const aliceMnemonic = bip39.generateMnemonic();
  const aliceSk = await InMemorySpendingKey.fromMnemonic(aliceMnemonic);

  // Generate keys for Bob
  const bobMnemonic = bip39.generateMnemonic();
  const bobSk = await InMemorySpendingKey.fromMnemonic(bobMnemonic);

  // Get viewing keys and payment addresses
  const aliceVk = await aliceSk.getSaplingViewingKeyProvider();
  const aliceAddress = (await aliceVk.getAddress()).address;

  const bobVk = await bobSk.getSaplingViewingKeyProvider();
  const bobAddress = (await bobVk.getAddress()).address;

  onProgress(
    "Generating spending keys for Alice and Bob",
    "success",
    `Alice: ${aliceAddress}, Bob: ${bobAddress}`,
  );

  // Wait for contract to be fully indexed with its Sapling state
  // The RPC node needs time to initialize the Sapling state tree
  // 404 errors mean the state isn't available yet
  onProgress("Waiting for contract Sapling state initialization", "pending");
  await new Promise((resolve) => setTimeout(resolve, 30000)); // 30 seconds
  onProgress("Waiting for contract Sapling state initialization", "success");

  // Create RPC read adapter with 404 handling for empty Sapling state
  const rpcUrl = tezos.rpc.getRpcUrl();
  const rpcClient = new RpcClient(rpcUrl);

  // Wrap RpcClient to handle 404 on empty Sapling state
  const originalGetSaplingDiff =
    rpcClient.getSaplingDiffByContract.bind(rpcClient);
  rpcClient.getSaplingDiffByContract = async (...args) => {
    try {
      return await originalGetSaplingDiff(...args);
    } catch (error: any) {
      // If 404, contract has no Sapling state yet - return proper empty state structure
      if (error?.status === 404 || error?.message?.includes("404")) {
        console.log(
          "Sapling state not found (404) - using empty state for new contract",
        );
        // Return structure matching RPC format for empty Sapling diff
        return {
          root: "0000000000000000000000000000000000000000000000000000000000000000",
          commitments_and_ciphertexts: [],
          nullifiers: [],
        };
      }
      throw error;
    }
  };

  const readProvider = new RpcReadAdapter(rpcClient);

  // Create toolkits using the RPC adapter with 404 handling
  const aliceToolkit = new SaplingToolkit(
    { saplingSigner: aliceSk },
    { contractAddress, memoSize: 8 },
    readProvider,
  );

  const bobToolkit = new SaplingToolkit(
    { saplingSigner: bobSk },
    { contractAddress, memoSize: 8 },
    readProvider,
  );

  onProgress("Shielding 3 tez for Alice", "pending");

  // Shield transaction - move 3 tez from public to private
  const shieldedTx = await aliceToolkit.prepareShieldedTransaction([
    {
      to: aliceAddress,
      amount: 3,
      memo: "Shield",
    },
  ]);

  const shieldOp = await saplingContract.methods.default([shieldedTx]).send({
    amount: 3,
  });
  await shieldOp.confirmation();

  const aliceTxViewer1 = await aliceToolkit.getSaplingTransactionViewer();
  const aliceBalance1 = await aliceTxViewer1.getBalance();

  onProgress(
    "Shielding 3 tez for Alice",
    "success",
    `Balance: ${aliceBalance1.toString()}`,
  );

  onProgress("Private transfer: Alice sends 2 tez to Bob", "pending");

  // Sapling transaction - private transfer between addresses
  const saplingTx = await aliceToolkit.prepareSaplingTransaction([
    {
      to: bobAddress,
      amount: 2,
      memo: "Gift",
    },
  ]);

  const transferOp = await saplingContract.methods.default([saplingTx]).send();
  await transferOp.confirmation();

  const aliceTxViewer2 = await aliceToolkit.getSaplingTransactionViewer();
  const aliceBalance2 = await aliceTxViewer2.getBalance();

  const bobTxViewer = await bobToolkit.getSaplingTransactionViewer();
  const bobBalance = await bobTxViewer.getBalance();

  onProgress(
    "Private transfer: Alice sends 2 tez to Bob",
    "success",
    `Alice: ${aliceBalance2.toString()}, Bob: ${bobBalance.toString()}`,
  );

  onProgress("Unshielding 1 tez to public address", "pending");

  // Unshield transaction - move 1 tez from private back to public
  const recipientAddress = await tezos.signer.publicKeyHash();
  const unshieldedTx = await aliceToolkit.prepareUnshieldedTransaction({
    to: recipientAddress,
    amount: 1,
  });

  const unshieldOp = await saplingContract.methods
    .default([unshieldedTx])
    .send();
  await unshieldOp.confirmation();

  const aliceTxViewer3 = await aliceToolkit.getSaplingTransactionViewer();
  const aliceBalance3 = await aliceTxViewer3.getBalance();

  onProgress(
    "Unshielding 1 tez to public address",
    "success",
    `Balance: ${aliceBalance3.toString()}`,
  );

  return {
    contractAddress,
    aliceAddress,
    bobAddress,
    operations: {
      shield: { hash: shieldOp.hash, balance: aliceBalance1 },
      transfer: {
        hash: transferOp.hash,
        aliceBalance: aliceBalance2,
        bobBalance,
      },
      unshield: { hash: unshieldOp.hash, balance: aliceBalance3 },
    },
  };
}
