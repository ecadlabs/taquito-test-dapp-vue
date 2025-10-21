import { RpcClient } from "@taquito/rpc";
import { InMemorySpendingKey, SaplingToolkit } from "@taquito/sapling";
import { RpcReadAdapter, type TezosToolkit } from "@taquito/taquito";
import * as bip39 from "bip39";

export interface SaplingKeys {
  aliceSk: InMemorySpendingKey;
  bobSk: InMemorySpendingKey;
  aliceAddress: string;
  bobAddress: string;
}

export interface SaplingBalance {
  aliceBalance: number;
  bobBalance: number;
}

/** Generate Sapling spending keys and addresses for Alice and Bob */
export async function generateSaplingKeys(): Promise<SaplingKeys> {
  // Generate keys for Alice
  const aliceMnemonic = bip39.generateMnemonic();
  const aliceSk = await InMemorySpendingKey.fromMnemonic(aliceMnemonic);
  const aliceVk = await aliceSk.getSaplingViewingKeyProvider();
  const aliceAddress = (await aliceVk.getAddress()).address;

  // Generate keys for Bob
  const bobMnemonic = bip39.generateMnemonic();
  const bobSk = await InMemorySpendingKey.fromMnemonic(bobMnemonic);
  const bobVk = await bobSk.getSaplingViewingKeyProvider();
  const bobAddress = (await bobVk.getAddress()).address;

  return {
    aliceSk,
    bobSk,
    aliceAddress,
    bobAddress,
  };
}

/**
 * Deploy a minimal Sapling contract for demonstration
 *
 * This contract accepts sapling_transaction parameters, allowing us to
 * demonstrate Taquito's client-side Sapling features: key generation, proof
 * creation, and transaction preparation.
 */
export async function deploySaplingContract(
  tezos: TezosToolkit,
): Promise<string> {
  const { singleSaplingStateContract } = await import(
    "@/contracts/sapling-contracts"
  );

  const op = await tezos.wallet
    .originate({
      code: singleSaplingStateContract(),
      storage: { prim: "Unit" },
    })
    .send();

  await op.confirmation();
  const contract = await op.contract();
  return contract.address;
}

/** Create RPC adapter with 404 handling for empty Sapling state */
function createSaplingRpcAdapter(rpcUrl: string): RpcReadAdapter {
  const rpcClient = new RpcClient(rpcUrl);

  // Wrap RpcClient to handle 404 on empty Sapling state
  const originalGetSaplingDiff =
    rpcClient.getSaplingDiffByContract.bind(rpcClient);
  rpcClient.getSaplingDiffByContract = async (...args) => {
    try {
      return await originalGetSaplingDiff(...args);
    } catch (error: unknown) {
      // If 404, contract has no Sapling state yet - return empty state structure
      if (
        (error as { status?: number })?.status === 404 ||
        (error as Error)?.message?.includes("404")
      ) {
        return {
          root: "0000000000000000000000000000000000000000000000000000000000000000",
          commitments_and_ciphertexts: [],
          nullifiers: [],
        };
      }
      throw error;
    }
  };

  return new RpcReadAdapter(rpcClient);
}

/** Shield operation - move tez from public to private address */
export async function shieldOperation(
  tezos: TezosToolkit,
  contractAddress: string,
  keys: SaplingKeys,
  amount: number,
  memo: string = "Shield",
): Promise<string> {
  const contract = await tezos.wallet.at(contractAddress);
  const readProvider = createSaplingRpcAdapter(tezos.rpc.getRpcUrl());

  const aliceToolkit = new SaplingToolkit(
    { saplingSigner: keys.aliceSk },
    { contractAddress, memoSize: 8 },
    readProvider,
  );

  const shieldedTx = await aliceToolkit.prepareShieldedTransaction([
    {
      to: keys.aliceAddress,
      amount,
      memo,
    },
  ]);

  // Call the contract with a single sapling transaction
  // Note: This minimal contract accepts but doesn't verify transactions
  const op = await contract.methods.default(shieldedTx).send({ amount });
  await op.confirmation();

  return op.opHash;
}

/** Get Sapling balances for Alice and Bob */
export async function getSaplingBalances(
  tezos: TezosToolkit,
  contractAddress: string,
  keys: SaplingKeys,
): Promise<SaplingBalance> {
  const readProvider = createSaplingRpcAdapter(tezos.rpc.getRpcUrl());

  const aliceToolkit = new SaplingToolkit(
    { saplingSigner: keys.aliceSk },
    { contractAddress, memoSize: 8 },
    readProvider,
  );

  const bobToolkit = new SaplingToolkit(
    { saplingSigner: keys.bobSk },
    { contractAddress, memoSize: 8 },
    readProvider,
  );

  const aliceTxViewer = await aliceToolkit.getSaplingTransactionViewer();
  const aliceBalance = await aliceTxViewer.getBalance();

  const bobTxViewer = await bobToolkit.getSaplingTransactionViewer();
  const bobBalance = await bobTxViewer.getBalance();

  return {
    aliceBalance: aliceBalance.toNumber(),
    bobBalance: bobBalance.toNumber(),
  };
}

/** Private transfer operation - send funds between Sapling addresses */
export async function transferOperation(
  tezos: TezosToolkit,
  contractAddress: string,
  keys: SaplingKeys,
  toAddress: string,
  amount: number,
  memo: string = "Transfer",
): Promise<string> {
  const contract = await tezos.wallet.at(contractAddress);
  const readProvider = createSaplingRpcAdapter(tezos.rpc.getRpcUrl());

  const aliceToolkit = new SaplingToolkit(
    { saplingSigner: keys.aliceSk },
    { contractAddress, memoSize: 8 },
    readProvider,
  );

  const saplingTx = await aliceToolkit.prepareSaplingTransaction([
    {
      to: toAddress,
      amount,
      memo,
    },
  ]);

  // Call the contract with a single sapling transaction (not a list)
  const op = await contract.methods.default(saplingTx).send();
  await op.confirmation();

  return op.opHash;
}

/** Unshield operation - move tez from private back to public address */
export async function unshieldOperation(
  tezos: TezosToolkit,
  contractAddress: string,
  keys: SaplingKeys,
  toAddress: string,
  amount: number,
): Promise<string> {
  const contract = await tezos.wallet.at(contractAddress);
  const readProvider = createSaplingRpcAdapter(tezos.rpc.getRpcUrl());

  const aliceToolkit = new SaplingToolkit(
    { saplingSigner: keys.aliceSk },
    { contractAddress, memoSize: 8 },
    readProvider,
  );

  const unshieldedTx = await aliceToolkit.prepareUnshieldedTransaction({
    to: toAddress,
    amount,
  });

  // Call the contract with a single sapling transaction (not a list)
  const op = await contract.methods.default(unshieldedTx).send();
  await op.confirmation();

  return op.opHash;
}
