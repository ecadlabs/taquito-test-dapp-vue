import { RpcClient } from "@taquito/rpc";
import type {
  InMemorySpendingKey,
  SaplingTransactionViewer,
} from "@taquito/sapling";
import {
  RpcReadAdapter,
  type Estimate,
  type TezosToolkit,
} from "@taquito/taquito";
import * as bip39 from "bip39";

export type SaplingViewerTransactions = Awaited<
  ReturnType<SaplingTransactionViewer["getIncomingAndOutgoingTransactions"]>
>;

type SaplingModule = typeof import("@taquito/sapling");
export type SaplingModuleWithRuntime = SaplingModule & {
  initSapling?: (options?: {
    params?: {
      source?: "taquito" | "zcash";
      spendParamsUrl?: string;
      spendParamsSha256?: string;
      outputParamsUrl?: string;
      outputParamsSha256?: string;
    };
  }) => Promise<void>;
  preloadSaplingParams?: () => Promise<void>;
};

const SAPLING_PARAMS_SOURCE = "taquito" as const;
const SAPLING_PARAMS_SPEND_URL =
  "https://sapling.taquito.io/params/groth16-mainnet-1/spend.params";
const SAPLING_PARAMS_SPEND_SHA256 =
  "8e48ffd23abb3a5fd9c5589204f32d9c31285a04b78096ba40a79b75677efc13";
const SAPLING_PARAMS_OUTPUT_URL =
  "https://sapling.taquito.io/params/groth16-mainnet-1/output.params";
const SAPLING_PARAMS_OUTPUT_SHA256 =
  "2f0ebbcbb9bb0bcffe95a397e7eba89c29eb4dde6191c339db88570e3f3fb0e4";
const SAPLING_FRESH_RELOAD_STORAGE_KEY = "sapling:fresh-params-reload";
const SAPLING_USER_MNEMONIC_STORAGE_KEY = "sapling:user-mnemonic";
const SAPLING_ALICE_MNEMONIC_STORAGE_KEY = "sapling:alice-mnemonic";

export type SaplingModuleStatus = "idle" | "loading" | "ready" | "failed";
export type SaplingParamsStatus =
  "not-loaded" | "preloading" | "ready" | "failed";

export interface SaplingRuntimeSnapshot {
  moduleStatus: SaplingModuleStatus;
  paramsStatus: SaplingParamsStatus;
  paramsSource: typeof SAPLING_PARAMS_SOURCE;
  errorMessage: string | null;
  lastPreloadDurationMs: number | null;
}

export interface SaplingStoreHooks {
  setTestDiagram: (testId: string, key?: string) => void;
  setProgress: (step: string) => void;
  setFeeEstimate: (estimate: Estimate | null) => void;
  setOperationHash: (opHash: string) => void;
  setCompleted: () => Promise<void> | void;
  getConfirmationCount: () => number;
}

type SaplingRuntimeListener = (snapshot: SaplingRuntimeSnapshot) => void;

const createInitialRuntimeSnapshot = (): SaplingRuntimeSnapshot => ({
  moduleStatus: "idle",
  paramsStatus: "not-loaded",
  paramsSource: SAPLING_PARAMS_SOURCE,
  errorMessage: null,
  lastPreloadDurationMs: null,
});

let saplingRuntimeSnapshot: SaplingRuntimeSnapshot =
  createInitialRuntimeSnapshot();

let saplingModulePromise: Promise<SaplingModuleWithRuntime> | undefined;
let saplingParamsPreloadPromise: Promise<SaplingRuntimeSnapshot> | undefined;
let customSaplingModuleLoader:
  (() => Promise<SaplingModuleWithRuntime>) | undefined;
let customStoreHooks: SaplingStoreHooks | undefined;

const runtimeSnapshotListeners = new Set<SaplingRuntimeListener>();

const notifySaplingRuntimeListeners = () => {
  const snapshot = getSaplingRuntimeSnapshot();
  for (const listener of runtimeSnapshotListeners) {
    listener(snapshot);
  }
};

const setSaplingRuntimeSnapshot = (next: Partial<SaplingRuntimeSnapshot>) => {
  saplingRuntimeSnapshot = {
    ...saplingRuntimeSnapshot,
    ...next,
  };
  notifySaplingRuntimeListeners();
};

export const subscribeSaplingRuntimeSnapshot = (
  listener: SaplingRuntimeListener,
): (() => void) => {
  runtimeSnapshotListeners.add(listener);
  listener(getSaplingRuntimeSnapshot());
  return () => {
    runtimeSnapshotListeners.delete(listener);
  };
};

export const setSaplingStoreHooks = (
  hooks: SaplingStoreHooks | undefined,
): void => {
  customStoreHooks = hooks;
};

export const setSaplingStoreHooksForTesting = setSaplingStoreHooks;

export const resetSaplingRuntimeForTesting = (
  loader?: () => Promise<unknown>,
): void => {
  saplingRuntimeSnapshot = createInitialRuntimeSnapshot();
  saplingModulePromise = undefined;
  saplingParamsPreloadPromise = undefined;
  customSaplingModuleLoader = loader as
    (() => Promise<SaplingModuleWithRuntime>) | undefined;
  customStoreHooks = undefined;
  notifySaplingRuntimeListeners();
};

const getNowMs = () => globalThis.performance?.now() ?? Date.now();

export const getSaplingErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const isSaplingParamsError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  typeof error.code === "string" &&
  error.code.startsWith("SAPLING_PARAMS_");

export const getSaplingRuntimeSnapshot = (): SaplingRuntimeSnapshot => ({
  ...saplingRuntimeSnapshot,
});

export const markSaplingProvingParamsReady = (
  elapsedMs: number | null = saplingRuntimeSnapshot.lastPreloadDurationMs,
): SaplingRuntimeSnapshot => {
  setSaplingRuntimeSnapshot({
    moduleStatus: "ready",
    paramsStatus: "ready",
    errorMessage: null,
    lastPreloadDurationMs: elapsedMs,
  });

  return getSaplingRuntimeSnapshot();
};

export const markSaplingProvingParamsFailed = (
  error: unknown,
): SaplingRuntimeSnapshot => {
  setSaplingRuntimeSnapshot({
    moduleStatus:
      saplingRuntimeSnapshot.moduleStatus === "failed" ? "failed" : "ready",
    paramsStatus: "failed",
    errorMessage: getSaplingErrorMessage(error),
    lastPreloadDurationMs: null,
  });

  return getSaplingRuntimeSnapshot();
};

const getSessionStorage = (): Storage | null => {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return null;
  }
  return window.sessionStorage;
};

const getSaplingFreshReloadToken = (): string | null => {
  const storage = getSessionStorage();
  if (!storage) {
    return null;
  }

  const token = storage.getItem(SAPLING_FRESH_RELOAD_STORAGE_KEY);

  if (token) {
    storage.removeItem(SAPLING_FRESH_RELOAD_STORAGE_KEY);
  }

  return token;
};

const getSaplingInitOptions = () => {
  const freshReloadToken = getSaplingFreshReloadToken();

  if (!freshReloadToken) {
    return {
      params: {
        source: SAPLING_PARAMS_SOURCE,
      },
    };
  }

  const query = `cacheBust=${encodeURIComponent(freshReloadToken)}`;

  return {
    params: {
      spendParamsUrl: `${SAPLING_PARAMS_SPEND_URL}?${query}`,
      spendParamsSha256: SAPLING_PARAMS_SPEND_SHA256,
      outputParamsUrl: `${SAPLING_PARAMS_OUTPUT_URL}?${query}`,
      outputParamsSha256: SAPLING_PARAMS_OUTPUT_SHA256,
    },
  };
};

const getSaplingModule = (): Promise<SaplingModuleWithRuntime> => {
  if (!saplingModulePromise) {
    setSaplingRuntimeSnapshot({ moduleStatus: "loading" });

    const loadModule =
      customSaplingModuleLoader ??
      (() => import("@taquito/sapling") as Promise<SaplingModuleWithRuntime>);

    saplingModulePromise = loadModule()
      .then(async (saplingModule) => {
        if (typeof saplingModule.initSapling === "function") {
          await saplingModule.initSapling(getSaplingInitOptions());
        }

        setSaplingRuntimeSnapshot({ moduleStatus: "ready" });
        return saplingModule;
      })
      .catch((error) => {
        saplingModulePromise = undefined;
        setSaplingRuntimeSnapshot({
          moduleStatus: "failed",
          errorMessage: getSaplingErrorMessage(error),
        });
        throw error;
      });
  }

  return saplingModulePromise;
};

export const preloadSaplingProvingParams =
  async (): Promise<SaplingRuntimeSnapshot> => {
    if (saplingRuntimeSnapshot.paramsStatus === "ready") {
      return getSaplingRuntimeSnapshot();
    }

    if (!saplingParamsPreloadPromise) {
      setSaplingRuntimeSnapshot({
        paramsStatus: "preloading",
        errorMessage: null,
        lastPreloadDurationMs: null,
      });

      saplingParamsPreloadPromise = (async () => {
        const startedAt = getNowMs();

        try {
          const saplingModule = await getSaplingModule();

          if (typeof saplingModule.preloadSaplingParams !== "function") {
            throw new Error(
              "Installed @taquito/sapling runtime does not expose preloadSaplingParams()",
            );
          }

          await saplingModule.preloadSaplingParams();
          return markSaplingProvingParamsReady(getNowMs() - startedAt);
        } catch (error) {
          markSaplingProvingParamsFailed(error);
          throw error;
        } finally {
          saplingParamsPreloadPromise = undefined;
        }
      })();
    }

    return saplingParamsPreloadPromise;
  };

export const clearStoredSaplingKeys = (): void => {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }
  storage.removeItem(SAPLING_USER_MNEMONIC_STORAGE_KEY);
  storage.removeItem(SAPLING_ALICE_MNEMONIC_STORAGE_KEY);
};

export const reloadWithFreshSaplingParams = (): void => {
  const storage = getSessionStorage();
  if (!storage || typeof window === "undefined") {
    return;
  }

  clearStoredSaplingKeys();
  storage.setItem(SAPLING_FRESH_RELOAD_STORAGE_KEY, `${Date.now()}`);
  window.location.reload();
};

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

/** Detailed information about a single Sapling note or transfer */
export interface SaplingTransaction {
  /** Transaction type: incoming note or outgoing transfer */
  type: "incoming" | "outgoing";
  /** Amount in mutez */
  amount: number;
  /** Optional memo attached to the note */
  memo?: string;
  /** Sapling payment address (zet1...) */
  paymentAddress: string;
  /** For incoming notes, whether the note has already been spent */
  isSpent?: boolean;
  /** For incoming notes, whether this note is change returned to self */
  isChange?: boolean;
}

/** User's complete Sapling transaction history */
export interface SaplingTransactionHistory {
  /** All transactions in chronological order */
  transactions: SaplingTransaction[];
  /** Total number of transactions */
  total: number;
}

const deriveSaplingKeyFromMnemonic = async (
  mnemonic: string,
): Promise<UserSaplingKey> => {
  const normalizedMnemonic = mnemonic.trim().replace(/\s+/g, " ");
  if (!bip39.validateMnemonic(normalizedMnemonic)) {
    throw new Error("Invalid BIP39 recovery mnemonic");
  }

  const { InMemorySpendingKey } = await getSaplingModule();
  const spendingKey =
    await InMemorySpendingKey.fromMnemonic(normalizedMnemonic);
  const viewingKey = await spendingKey.getSaplingViewingKeyProvider();
  const address = (await viewingKey.getAddress()).address;

  return {
    spendingKey,
    address,
    mnemonic: normalizedMnemonic,
  };
};

/**
 * Generates or restores a Sapling spending key and payment address for the
 * user.
 *
 * Persists the mnemonic in `sessionStorage` so navigating between tests within
 * the same tab does not orphan shielded funds.
 */
export async function generateUserSpendingKey(options?: {
  mnemonic?: string;
  forceNew?: boolean;
}): Promise<UserSaplingKey> {
  const storage = getSessionStorage();
  let mnemonic = options?.mnemonic?.trim();

  if (!mnemonic && !options?.forceNew && storage) {
    mnemonic = storage.getItem(SAPLING_USER_MNEMONIC_STORAGE_KEY) ?? undefined;
  }

  if (!mnemonic || (!options?.mnemonic && !bip39.validateMnemonic(mnemonic))) {
    mnemonic = bip39.generateMnemonic();
  }

  const key = await deriveSaplingKeyFromMnemonic(mnemonic);
  storage?.setItem(SAPLING_USER_MNEMONIC_STORAGE_KEY, key.mnemonic);
  return key;
}

/**
 * Generates or restores a session-scoped Sapling spending key for Alice.
 *
 * Using a session-scoped key for Alice lets the user inspect Alice's incoming
 * shielded balance cleanly without accumulating state from unrelated test
 * runs.
 */
export async function generateAliceSpendingKey(options?: {
  forceNew?: boolean;
}): Promise<UserSaplingKey> {
  const storage = getSessionStorage();
  let mnemonic = !options?.forceNew
    ? (storage?.getItem(SAPLING_ALICE_MNEMONIC_STORAGE_KEY) ?? undefined)
    : undefined;

  if (!mnemonic || !bip39.validateMnemonic(mnemonic)) {
    mnemonic = bip39.generateMnemonic();
  }

  const key = await deriveSaplingKeyFromMnemonic(mnemonic);
  storage?.setItem(SAPLING_ALICE_MNEMONIC_STORAGE_KEY, key.mnemonic);
  return key;
}

/** Generates Alice's Sapling payment address. */
export async function generateAliceAddress(): Promise<string> {
  const storage = getSessionStorage();
  if (storage) {
    const aliceKey = await generateAliceSpendingKey();
    return aliceKey.address;
  }

  const { InMemorySpendingKey } = await getSaplingModule();
  const aliceSk = await InMemorySpendingKey.fromMnemonic(ALICE_MNEMONIC);
  const aliceVk = await aliceSk.getSaplingViewingKeyProvider();
  return (await aliceVk.getAddress()).address;
}

/** Creates an RPC adapter with 404 error handling for empty Sapling state */
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

const resolveStoreHooks = async (): Promise<SaplingStoreHooks> => {
  if (customStoreHooks) {
    return customStoreHooks;
  }

  const [{ useDiagramStore }, { useSettingsStore }] = await Promise.all([
    import("@/stores/diagramStore"),
    import("@/stores/settingsStore"),
  ]);
  const diagramStore = useDiagramStore();
  const settingsStore = useSettingsStore();

  return {
    setTestDiagram: (testId, key) => diagramStore.setTestDiagram(testId, key),
    setProgress: (step) => diagramStore.setProgress(step),
    setFeeEstimate: (estimate) => diagramStore.setFeeEstimate(estimate),
    setOperationHash: (opHash) => diagramStore.setOperationHash(opHash),
    setCompleted: () => diagramStore.setCompleted(),
    getConfirmationCount: () => settingsStore.getConfirmationCount,
  };
};

const assertPositiveAmount = (amount: number, operationLabel: string): void => {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`${operationLabel} amount must be a positive number`);
  }
};

const estimateContractCallIfSupported = async (
  tezos: TezosToolkit,
  methodCall: {
    toTransferParams?: (params?: { amount?: number }) => unknown;
  },
  sendParams: { amount?: number } | undefined,
  hooks: SaplingStoreHooks,
): Promise<void> => {
  if (
    typeof methodCall.toTransferParams !== "function" ||
    typeof tezos.estimate?.transfer !== "function"
  ) {
    return;
  }

  try {
    const transferParams = await methodCall.toTransferParams(sendParams);
    const estimate = await tezos.estimate.transfer(transferParams as never);
    if (estimate) {
      hooks.setFeeEstimate(estimate);
    }
  } catch {
    // Fee estimation is best-effort and should not block Sapling execution
  }
};

/**
 * Shields tez by moving them from a public address to the user's private
 * Sapling address
 */
export async function shieldToUser(
  tezos: TezosToolkit,
  contractAddress: string,
  userKey: UserSaplingKey,
  amount: number,
): Promise<string> {
  assertPositiveAmount(amount, "Shield");

  if (customStoreHooks) {
    customStoreHooks.setTestDiagram(TEST_ID, "shield");
    customStoreHooks.setProgress("prepare-shield");
  }

  const hooks = customStoreHooks ?? (await resolveStoreHooks());
  if (!customStoreHooks) {
    hooks.setTestDiagram(TEST_ID, "shield");
    hooks.setProgress("prepare-shield");
  }

  await preloadSaplingProvingParams();
  const { SaplingToolkit } = await getSaplingModule();

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

  const methodCall = contract.methodsObject.default([shieldedTx]);
  await estimateContractCallIfSupported(tezos, methodCall, { amount }, hooks);

  hooks.setProgress("wait-for-user");
  const op = await methodCall.send({ amount });

  hooks.setProgress("wait-for-chain-confirmation");
  await op.confirmation(hooks.getConfirmationCount());

  hooks.setOperationHash(op.opHash);
  await hooks.setCompleted();
  return op.opHash;
}

/** Transfers tez privately from the user to Alice's Sapling address */
export async function transferToAlice(
  tezos: TezosToolkit,
  contractAddress: string,
  userKey: UserSaplingKey,
  aliceAddress: string,
  amount: number,
): Promise<string> {
  assertPositiveAmount(amount, "Transfer");

  if (customStoreHooks) {
    customStoreHooks.setTestDiagram(TEST_ID, "transfer");
    customStoreHooks.setProgress("prepare-transfer");
  }

  const hooks = customStoreHooks ?? (await resolveStoreHooks());
  if (!customStoreHooks) {
    hooks.setTestDiagram(TEST_ID, "transfer");
    hooks.setProgress("prepare-transfer");
  }

  await preloadSaplingProvingParams();
  const { SaplingToolkit } = await getSaplingModule();

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

  const methodCall = contract.methodsObject.default([saplingTx]);
  await estimateContractCallIfSupported(tezos, methodCall, undefined, hooks);

  hooks.setProgress("wait-for-user");
  const op = await methodCall.send();

  hooks.setProgress("wait-for-chain-confirmation");
  await op.confirmation(hooks.getConfirmationCount());

  hooks.setOperationHash(op.opHash);
  await hooks.setCompleted();
  return op.opHash;
}

/**
 * Unshields tez by moving them from the user's private Sapling address to a
 * public Tezos address
 */
export async function unshieldToUser(
  tezos: TezosToolkit,
  contractAddress: string,
  userKey: UserSaplingKey,
  toAddress: string,
  amount: number,
): Promise<string> {
  assertPositiveAmount(amount, "Unshield");

  if (customStoreHooks) {
    customStoreHooks.setTestDiagram(TEST_ID, "unshield");
    customStoreHooks.setProgress("prepare-unshield");
  }

  const hooks = customStoreHooks ?? (await resolveStoreHooks());
  if (!customStoreHooks) {
    hooks.setTestDiagram(TEST_ID, "unshield");
    hooks.setProgress("prepare-unshield");
  }

  await preloadSaplingProvingParams();
  const { SaplingToolkit } = await getSaplingModule();

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

  const methodCall = contract.methodsObject.default([unshieldedTx]);
  await estimateContractCallIfSupported(tezos, methodCall, undefined, hooks);

  hooks.setProgress("wait-for-user");
  const op = await methodCall.send();

  hooks.setProgress("wait-for-chain-confirmation");
  await op.confirmation(hooks.getConfirmationCount());

  hooks.setOperationHash(op.opHash);
  await hooks.setCompleted();
  return op.opHash;
}

const normalizeMemo = (memo: string | undefined): string | undefined => {
  if (!memo) {
    return undefined;
  }
  const cleaned = memo.replace(/\0/g, "");
  return cleaned.length > 0 ? cleaned : undefined;
};

/**
 * Formats raw incoming and outgoing viewer data into a chronological list of
 * Sapling notes without duplicating self-change outputs as outgoing payments.
 */
export function formatSaplingTransactionHistory(
  txData: SaplingViewerTransactions,
  userAddress: string,
): SaplingTransactionHistory {
  const transactions: SaplingTransaction[] = [];
  const pendingOutgoing: SaplingTransaction[] = [];
  let inIdx = 0;

  for (const outTx of txData.outgoing) {
    const outAmount = Number(outTx.value);
    const outMemo = normalizeMemo(outTx.memo);

    if (outTx.paymentAddress !== userAddress || outMemo !== undefined) {
      pendingOutgoing.push({
        type: "outgoing",
        amount: outAmount,
        memo: outMemo,
        paymentAddress: outTx.paymentAddress,
        isSpent: undefined,
        isChange: false,
      });
      continue;
    }

    // Self-addressed output in outgoing was created as payback (change) during
    // a spend (transfer or unshield). Find the corresponding note in incoming.
    let matchIdx = -1;
    for (let i = inIdx; i < txData.incoming.length; i++) {
      const candidate = txData.incoming[i];
      if (
        candidate.paymentAddress === userAddress &&
        normalizeMemo(candidate.memo) === outMemo &&
        Number(candidate.value) === outAmount
      ) {
        matchIdx = i;
        break;
      }
    }

    if (matchIdx !== -1) {
      while (inIdx < matchIdx) {
        const inc = txData.incoming[inIdx++];
        transactions.push({
          type: "incoming",
          amount: Number(inc.value),
          memo: normalizeMemo(inc.memo),
          paymentAddress: inc.paymentAddress,
          isSpent: inc.isSpent,
          isChange: false,
        });
      }

      if (pendingOutgoing.length > 0) {
        transactions.push(...pendingOutgoing.splice(0, pendingOutgoing.length));
      }

      const matchedChange = txData.incoming[inIdx++];
      const changeAmount = Number(matchedChange.value);
      if (changeAmount > 0 || normalizeMemo(matchedChange.memo) !== undefined) {
        transactions.push({
          type: "incoming",
          amount: changeAmount,
          memo: normalizeMemo(matchedChange.memo),
          paymentAddress: matchedChange.paymentAddress,
          isSpent: matchedChange.isSpent,
          isChange: true,
        });
      }
    } else if (pendingOutgoing.length > 0) {
      transactions.push(...pendingOutgoing.splice(0, pendingOutgoing.length));
    }
  }

  while (inIdx < txData.incoming.length) {
    const inc = txData.incoming[inIdx++];
    transactions.push({
      type: "incoming",
      amount: Number(inc.value),
      memo: normalizeMemo(inc.memo),
      paymentAddress: inc.paymentAddress,
      isSpent: inc.isSpent,
      isChange: false,
    });
  }

  if (pendingOutgoing.length > 0) {
    transactions.push(...pendingOutgoing);
  }

  return {
    transactions,
    total: transactions.length,
  };
}

/** Retrieves the user's complete Sapling transaction history */
export async function getUserTransactionHistory(
  tezos: TezosToolkit,
  contractAddress: string,
  userKey: UserSaplingKey,
): Promise<SaplingTransactionHistory> {
  const { SaplingToolkit } = await getSaplingModule();
  const readProvider = createSaplingRpcAdapter(tezos.rpc.getRpcUrl());

  const toolkit = new SaplingToolkit(
    { saplingSigner: userKey.spendingKey },
    { contractAddress, memoSize: MEMO_SIZE },
    readProvider,
  );

  const transactionViewer = await toolkit.getSaplingTransactionViewer();
  const txData = await transactionViewer.getIncomingAndOutgoingTransactions();

  return formatSaplingTransactionHistory(txData, userKey.address);
}

/** Retrieves the balance for a Sapling key from the shielded pool */
export async function getUserSaplingBalance(
  tezos: TezosToolkit,
  contractAddress: string,
  userKey: UserSaplingKey,
): Promise<number> {
  const { SaplingToolkit } = await getSaplingModule();
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
