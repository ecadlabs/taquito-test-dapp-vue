import { useDiagramStore } from "@/stores/diagramStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { RpcClient } from "@taquito/rpc";
import { InMemorySpendingKey, SaplingToolkit } from "@taquito/sapling";
import { RpcReadAdapter, type TezosToolkit } from "@taquito/taquito";
import * as bip39 from "bip39";

// Must match contract's memo size
const MEMO_SIZE = 8;
const ALICE_MNEMONIC =
  "normal dash crumble neutral reflect parrot know stairs culture fault check whale flock dog account";

const TEST_ID = "sapling";

export interface UserSaplingKey {
  spendingKey: InMemorySpendingKey;
  address: string;
  mnemonic: string;
}

/** Detailed information about a single Sapling transaction */
export interface SaplingTransaction {
  /** Transaction type: incoming or outgoing */
  type: "incoming" | "outgoing";
  /** Amount in mutez */
  amount: number;
  /** Optional memo attached to the transaction */
  memo?: string;
}

/** User's complete Sapling transaction history */
export interface SaplingTransactionHistory {
  /** All transactions in chronological order */
  transactions: SaplingTransaction[];
  /** Total number of transactions */
  total: number;
}

/**
 * Generates a new Sapling spending key and payment address for the user
 *
 * Creates a random BIP39 mnemonic and derives a Sapling spending key from it.
 * The spending key is kept in memory and used to sign private transactions.
 *
 * @returns Promise resolving to the spending key, payment address, and mnemonic
 * @throws Error if key generation or address derivation fails
 */
export async function generateUserSpendingKey(): Promise<UserSaplingKey> {
  const mnemonic = bip39.generateMnemonic();
  const spendingKey = await InMemorySpendingKey.fromMnemonic(mnemonic);
  const viewingKey = await spendingKey.getSaplingViewingKeyProvider();
  const address = (await viewingKey.getAddress()).address;

  return {
    spendingKey,
    address,
    mnemonic,
  };
}

/**
 * Generates Alice's Sapling payment address from a predefined mnemonic
 *
 * Uses a fixed mnemonic to derive Alice's spending key and payment address.
 * This allows consistent address generation for testing purposes.
 *
 * @returns Promise resolving to Alice's Sapling payment address
 * @throws Error if address derivation fails
 */
export async function generateAliceAddress(): Promise<string> {
  const aliceSk = await InMemorySpendingKey.fromMnemonic(ALICE_MNEMONIC);
  const aliceVk = await aliceSk.getSaplingViewingKeyProvider();
  const aliceAddress = (await aliceVk.getAddress()).address;

  return aliceAddress;
}

/**
 * Creates an RPC adapter with 404 error handling for empty Sapling state
 *
 * Wraps the RpcClient to gracefully handle 404 errors that occur when querying
 * Sapling state from contracts that haven't been initialized yet. Returns an
 * empty state structure instead of throwing an error.
 *
 * @param rpcUrl - The RPC endpoint URL to connect to
 * @returns RpcReadAdapter configured with error handling
 * @internal
 */
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

/**
 * Shields tez by moving them from a public address to the user's private
 * Sapling address
 *
 * Prepares and executes a shielded transaction that transfers tez from the
 * user's public account into the Sapling shielded pool. This operation
 * generates a zero-knowledge proof (10-30s) and updates the diagram store with
 * progress.
 *
 * @param tezos - Taquito instance configured with wallet
 * @param contractAddress - Address of the Sapling contract
 * @param userKey - User's Sapling spending key and address
 * @param amount - Amount to shield in tez (not mutez)
 * @returns Promise resolving to the operation hash
 * @throws Error if proof generation, transaction preparation, or confirmation
 *   fails
 */
export async function shieldToUser(
  tezos: TezosToolkit,
  contractAddress: string,
  userKey: UserSaplingKey,
  amount: number,
): Promise<string> {
  const diagramStore = useDiagramStore();
  const settingsStore = useSettingsStore();

  diagramStore.setTestDiagram(TEST_ID, "shield");
  diagramStore.setProgress("prepare-shield");

  const contract = await tezos.wallet.at(contractAddress);
  const readProvider = createSaplingRpcAdapter(tezos.rpc.getRpcUrl());

  const toolkit = new SaplingToolkit(
    { saplingSigner: userKey.spendingKey },
    { contractAddress, memoSize: MEMO_SIZE },
    readProvider,
  );

  const shieldedTx = await toolkit.prepareShieldedTransaction([
    {
      to: userKey.address,
      amount,
      memo: "Shield",
    },
  ]);

  diagramStore.setProgress("call-contract");
  const op = await contract.methodsObject
    .default([shieldedTx])
    .send({ amount });

  diagramStore.setProgress("wait-for-chain-confirmation");
  const confirmation = await op.confirmation(
    settingsStore.getConfirmationCount,
  );

  if (confirmation?.block.hash) {
    diagramStore.setOperationHash(confirmation.block.hash);
  }

  diagramStore.setCompleted();
  return op.opHash;
}

/**
 * Transfers tez privately from the user to Alice's Sapling address
 *
 * Executes a private transfer within the Sapling shielded pool. Both sender and
 * receiver remain private, and only the spending key holder can see the
 * transaction. This operation generates a zero-knowledge proof (10-30s).
 *
 * @param tezos - Taquito instance configured with wallet
 * @param contractAddress - Address of the Sapling contract
 * @param userKey - User's Sapling spending key and address
 * @param aliceAddress - Alice's Sapling payment address
 * @param amount - Amount to transfer in tez (not mutez)
 * @returns Promise resolving to the operation hash
 * @throws Error if insufficient balance, proof generation, or confirmation
 *   fails
 */
export async function transferToAlice(
  tezos: TezosToolkit,
  contractAddress: string,
  userKey: UserSaplingKey,
  aliceAddress: string,
  amount: number,
): Promise<string> {
  const diagramStore = useDiagramStore();
  const settingsStore = useSettingsStore();

  diagramStore.setTestDiagram(TEST_ID, "transfer");
  diagramStore.setProgress("prepare-transfer");

  const contract = await tezos.wallet.at(contractAddress);
  const readProvider = createSaplingRpcAdapter(tezos.rpc.getRpcUrl());

  const toolkit = new SaplingToolkit(
    { saplingSigner: userKey.spendingKey },
    { contractAddress, memoSize: MEMO_SIZE },
    readProvider,
  );

  const saplingTx = await toolkit.prepareSaplingTransaction([
    {
      to: aliceAddress,
      amount,
      memo: "Transfer",
    },
  ]);

  diagramStore.setProgress("call-contract");
  const op = await contract.methodsObject.default([saplingTx]).send();

  diagramStore.setProgress("wait-for-chain-confirmation");
  const confirmation = await op.confirmation(
    settingsStore.getConfirmationCount,
  );

  if (confirmation?.block.hash) {
    diagramStore.setOperationHash(confirmation.block.hash);
  }

  diagramStore.setCompleted();
  return op.opHash;
}

/**
 * Unshields tez by moving them from the user's private Sapling address to a
 * public address
 *
 * Prepares and executes an unshielded transaction that withdraws tez from the
 * Sapling shielded pool back to a public Tezos address. This operation
 * generates a zero-knowledge proof (10-30s).
 *
 * @param tezos - Taquito instance configured with wallet
 * @param contractAddress - Address of the Sapling contract
 * @param userKey - User's Sapling spending key and address
 * @param toAddress - Destination public Tezos address (tz1, tz2, or tz3)
 * @param amount - Amount to unshield in tez (not mutez)
 * @returns Promise resolving to the operation hash
 * @throws Error if insufficient balance, proof generation, or confirmation
 *   fails
 */
export async function unshieldToUser(
  tezos: TezosToolkit,
  contractAddress: string,
  userKey: UserSaplingKey,
  toAddress: string,
  amount: number,
): Promise<string> {
  const diagramStore = useDiagramStore();
  const settingsStore = useSettingsStore();

  diagramStore.setTestDiagram(TEST_ID, "unshield");
  diagramStore.setProgress("prepare-unshield");

  const contract = await tezos.wallet.at(contractAddress);
  const readProvider = createSaplingRpcAdapter(tezos.rpc.getRpcUrl());

  const toolkit = new SaplingToolkit(
    { saplingSigner: userKey.spendingKey },
    { contractAddress, memoSize: MEMO_SIZE },
    readProvider,
  );

  const unshieldedTx = await toolkit.prepareUnshieldedTransaction({
    to: toAddress,
    amount,
  });

  diagramStore.setProgress("call-contract");
  const op = await contract.methodsObject.default([unshieldedTx]).send();

  diagramStore.setProgress("wait-for-chain-confirmation");
  const confirmation = await op.confirmation(
    settingsStore.getConfirmationCount,
  );

  if (confirmation?.block.hash) {
    diagramStore.setOperationHash(confirmation.block.hash);
  }

  diagramStore.setCompleted();
  return op.opHash;
}

/**
 * Retrieves the user's complete Sapling transaction history
 *
 * Queries the Sapling shielded pool to get all incoming and outgoing
 * transactions. Transactions are sorted chronologically by position. Note:
 * Sapling uses a UTXO model, so a single operation may result in multiple
 * transactions (e.g., spending a full amount and receiving change).
 *
 * @param tezos - Taquito instance configured with wallet
 * @param contractAddress - Address of the Sapling contract
 * @param userKey - User's Sapling spending key and address
 * @returns Promise resolving to the complete transaction history
 * @throws Error if transaction query fails
 */
export async function getUserTransactionHistory(
  tezos: TezosToolkit,
  contractAddress: string,
  userKey: UserSaplingKey,
): Promise<SaplingTransactionHistory> {
  const readProvider = createSaplingRpcAdapter(tezos.rpc.getRpcUrl());

  const toolkit = new SaplingToolkit(
    { saplingSigner: userKey.spendingKey },
    { contractAddress, memoSize: MEMO_SIZE },
    readProvider,
  );

  const transactionViewer = await toolkit.getSaplingTransactionViewer();
  const txData = await transactionViewer.getIncomingAndOutgoingTransactions();

  // Map transactions with their position index for chronological ordering
  const incomingWithPosition = txData.incoming.map((tx, idx) => ({
    type: "incoming" as const,
    amount: Number(tx.value),
    memo: tx.memo
      ? Buffer.from(tx.memo).toString("utf-8").replace(/\0/g, "")
      : undefined,
    position: idx,
    isIncoming: true,
  }));

  const outgoingWithPosition = txData.outgoing.map((tx, idx) => ({
    type: "outgoing" as const,
    amount: Number(tx.value),
    memo: tx.memo
      ? Buffer.from(tx.memo).toString("utf-8").replace(/\0/g, "")
      : undefined,
    position: idx,
    isIncoming: false,
  }));

  // Interleave transactions based on position to maintain chronological order
  const allTransactions = [...incomingWithPosition, ...outgoingWithPosition];

  // Sort by position and type to maintain order as they appear on chain
  allTransactions.sort((a, b) => {
    // Alternate between incoming and outgoing at the same position
    if (a.position === b.position) {
      return a.isIncoming === b.isIncoming ? 0 : a.isIncoming ? -1 : 1;
    }
    return a.position - b.position;
  });

  const transactions: SaplingTransaction[] = allTransactions.map(
    ({ type, amount, memo }) => ({
      type,
      amount,
      memo,
    }),
  );

  return {
    transactions,
    total: transactions.length,
  };
}

/**
 * Retrieves the user's balance from the Sapling shielded pool
 *
 * Queries the Sapling contract to calculate the user's unspent balance. The
 * balance represents the total amount available for transfers or unshielding.
 *
 * @param tezos - Taquito instance configured with wallet
 * @param contractAddress - Address of the Sapling contract
 * @param userKey - User's Sapling spending key and address
 * @returns Promise resolving to the balance in mutez
 * @throws Error if balance query fails
 */
export async function getUserSaplingBalance(
  tezos: TezosToolkit,
  contractAddress: string,
  userKey: UserSaplingKey,
): Promise<number> {
  const readProvider = createSaplingRpcAdapter(tezos.rpc.getRpcUrl());

  const toolkit = new SaplingToolkit(
    { saplingSigner: userKey.spendingKey },
    { contractAddress, memoSize: MEMO_SIZE },
    readProvider,
  );

  const transactionViewer = await toolkit.getSaplingTransactionViewer();
  const balance = await transactionViewer.getBalance();

  // Balance is returned as BigNumber, convert to number
  return balance.toNumber();
}
