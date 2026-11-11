import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import BigNumber from "bignumber.js";

const USER_ADDRESS =
  "zet13X32372s66F124321321321321321321321321321321321321321321321321";
const ALICE_ADDRESS =
  "zet14Y43483t77G235432432432432432432432432432432432432432432432432";

test("sapling runtime snapshot notifies subscribers of preloading before preload resolves", async () => {
  const saplingModule = await import("@/modules/tests/tests/sapling/sapling");

  assert.equal(
    typeof (saplingModule as Record<string, unknown>)
      .subscribeSaplingRuntimeSnapshot,
    "function",
    "Expected sapling.ts to export subscribeSaplingRuntimeSnapshot",
  );
  assert.equal(
    typeof (saplingModule as Record<string, unknown>)
      .resetSaplingRuntimeForTesting,
    "function",
    "Expected sapling.ts to export resetSaplingRuntimeForTesting",
  );

  let resolvePreload!: () => void;
  const preloadGate = new Promise<void>((resolve) => {
    resolvePreload = resolve;
  });

  const resetForTesting = (
    saplingModule as unknown as {
      resetSaplingRuntimeForTesting: (loader?: () => Promise<unknown>) => void;
    }
  ).resetSaplingRuntimeForTesting;
  const subscribe = (
    saplingModule as unknown as {
      subscribeSaplingRuntimeSnapshot: (
        listener: (snapshot: { paramsStatus: string }) => void,
      ) => () => void;
    }
  ).subscribeSaplingRuntimeSnapshot;

  resetForTesting(async () => ({
    initSapling: async () => {},
    preloadSaplingParams: () => preloadGate,
  }));

  const observedStatuses: string[] = [];
  const unsubscribe = subscribe((snapshot) => {
    observedStatuses.push(snapshot.paramsStatus);
  });

  try {
    const preloadPromise = saplingModule.preloadSaplingProvingParams();
    assert.ok(
      observedStatuses.includes("preloading"),
      "Subscriber should receive 'preloading' status synchronously when preload starts",
    );

    resolvePreload();
    const finalSnapshot = await preloadPromise;
    assert.equal(finalSnapshot.paramsStatus, "ready");
    assert.ok(observedStatuses.includes("ready"));
    assert.notEqual(finalSnapshot.lastPreloadDurationMs, null);
  } finally {
    unsubscribe();
    resetForTesting();
  }
});

test("formatSaplingTransactionHistory preserves chronological order and filters duplicate self-change outgoing notes", async () => {
  const saplingModule = await import("@/modules/tests/tests/sapling/sapling");

  assert.equal(
    typeof (saplingModule as Record<string, unknown>)
      .formatSaplingTransactionHistory,
    "function",
    "Expected sapling.ts to export formatSaplingTransactionHistory",
  );

  const formatHistory = (
    saplingModule as unknown as {
      formatSaplingTransactionHistory: (
        txData: {
          incoming: Array<{
            value: BigNumber;
            memo: string;
            paymentAddress: string;
            isSpent: boolean;
          }>;
          outgoing: Array<{
            value: BigNumber;
            memo: string;
            paymentAddress: string;
          }>;
        },
        userAddress: string,
      ) => {
        total: number;
        transactions: Array<{
          type: "incoming" | "outgoing";
          amount: number;
          memo?: string;
          paymentAddress: string;
          isSpent?: boolean;
          isChange?: boolean;
        }>;
      };
    }
  ).formatSaplingTransactionHistory;

  // Scenario:
  // 1. User shields 3 tez (spent later)
  // 2. User shields 5 tez (unspent)
  // 3. User transfers 1 tez to Alice from the 3 tez note -> creates 1 tez outgoing to Alice + 2 tez self-change
  // 4. User unshields 1 tez from the 2 tez change note -> creates 1 tez self-change
  const rawViewerData = {
    incoming: [
      {
        value: new BigNumber(3_000_000),
        memo: "Shield",
        paymentAddress: USER_ADDRESS,
        isSpent: true,
      },
      {
        value: new BigNumber(5_000_000),
        memo: "Shield",
        paymentAddress: USER_ADDRESS,
        isSpent: false,
      },
      {
        value: new BigNumber(2_000_000),
        memo: "",
        paymentAddress: USER_ADDRESS,
        isSpent: true,
      },
      {
        value: new BigNumber(1_000_000),
        memo: "",
        paymentAddress: USER_ADDRESS,
        isSpent: false,
      },
    ],
    outgoing: [
      {
        value: new BigNumber(1_000_000),
        memo: "Transfer",
        paymentAddress: ALICE_ADDRESS,
      },
      {
        value: new BigNumber(2_000_000),
        memo: "",
        paymentAddress: USER_ADDRESS,
      },
      {
        value: new BigNumber(1_000_000),
        memo: "",
        paymentAddress: USER_ADDRESS,
      },
    ],
  };

  const history = formatHistory(rawViewerData, USER_ADDRESS);

  assert.equal(history.total, 5);
  assert.deepEqual(
    history.transactions.map((tx) => ({
      type: tx.type,
      amount: tx.amount,
      memo: tx.memo,
      isSpent: tx.isSpent,
      isChange: tx.isChange,
    })),
    [
      {
        type: "incoming",
        amount: 3_000_000,
        memo: "Shield",
        isSpent: true,
        isChange: false,
      },
      {
        type: "incoming",
        amount: 5_000_000,
        memo: "Shield",
        isSpent: false,
        isChange: false,
      },
      {
        type: "outgoing",
        amount: 1_000_000,
        memo: "Transfer",
        isSpent: undefined,
        isChange: false,
      },
      {
        type: "incoming",
        amount: 2_000_000,
        memo: undefined,
        isSpent: true,
        isChange: true,
      },
      {
        type: "incoming",
        amount: 1_000_000,
        memo: undefined,
        isSpent: false,
        isChange: true,
      },
    ],
  );

  // Shuffled output ordering (outputOrder: 'randomized'):
  // When the self-change output appears BEFORE the recipient output in txData.outgoing,
  // followed by a subsequent incoming shield note from another sender, the recipient outgoing
  // note must remain grouped with its transfer before the subsequent incoming shield note.
  const shuffledViewerData = {
    incoming: [
      {
        value: new BigNumber(3_000_000),
        memo: "Shield",
        paymentAddress: USER_ADDRESS,
        isSpent: true,
      },
      {
        value: new BigNumber(2_000_000),
        memo: "",
        paymentAddress: USER_ADDRESS,
        isSpent: false,
      },
      {
        value: new BigNumber(4_000_000),
        memo: "Later",
        paymentAddress: USER_ADDRESS,
        isSpent: false,
      },
    ],
    outgoing: [
      // Self-change note shuffled before the recipient note in the transfer
      {
        value: new BigNumber(2_000_000),
        memo: "",
        paymentAddress: USER_ADDRESS,
      },
      {
        value: new BigNumber(1_000_000),
        memo: "Transfer",
        paymentAddress: ALICE_ADDRESS,
      },
    ],
  };

  const shuffledHistory = formatHistory(shuffledViewerData, USER_ADDRESS);

  assert.equal(shuffledHistory.total, 4);
  assert.deepEqual(
    shuffledHistory.transactions.map((tx) => ({
      type: tx.type,
      amount: tx.amount,
      memo: tx.memo,
      isSpent: tx.isSpent,
      isChange: tx.isChange,
    })),
    [
      {
        type: "incoming",
        amount: 3_000_000,
        memo: "Shield",
        isSpent: true,
        isChange: false,
      },
      {
        type: "outgoing",
        amount: 1_000_000,
        memo: "Transfer",
        isSpent: undefined,
        isChange: false,
      },
      {
        type: "incoming",
        amount: 2_000_000,
        memo: undefined,
        isSpent: false,
        isChange: true,
      },
      {
        type: "incoming",
        amount: 4_000_000,
        memo: "Later",
        isSpent: false,
        isChange: false,
      },
    ],
  );

  // Unshield followed by private transfer:
  // 1. User shields 5 tez (spent later)
  // 2. User unshields 2 tez -> creates 3 tez self-change (no recipient note in pool)
  // 3. User transfers 1 tez to Alice -> creates 1 tez outgoing to Alice + 2 tez self-change
  // The unshield's self-change note must NOT steal Alice's subsequent outgoing note!
  const unshieldThenTransferData = {
    incoming: [
      {
        value: new BigNumber(5_000_000),
        memo: "Shield",
        paymentAddress: USER_ADDRESS,
        isSpent: true,
      },
      {
        value: new BigNumber(3_000_000),
        memo: "",
        paymentAddress: USER_ADDRESS,
        isSpent: true,
      },
      {
        value: new BigNumber(2_000_000),
        memo: "",
        paymentAddress: USER_ADDRESS,
        isSpent: false,
      },
    ],
    outgoing: [
      // Unshield change note (3 tez)
      {
        value: new BigNumber(3_000_000),
        memo: "",
        paymentAddress: USER_ADDRESS,
      },
      // Subsequent transfer to Alice (1 tez recipient + 2 tez change)
      {
        value: new BigNumber(1_000_000),
        memo: "Transfer",
        paymentAddress: ALICE_ADDRESS,
      },
      {
        value: new BigNumber(2_000_000),
        memo: "",
        paymentAddress: USER_ADDRESS,
      },
    ],
  };

  const unshieldThenTransferHistory = formatHistory(
    unshieldThenTransferData,
    USER_ADDRESS,
  );

  assert.equal(unshieldThenTransferHistory.total, 4);
  assert.deepEqual(
    unshieldThenTransferHistory.transactions.map((tx) => ({
      type: tx.type,
      amount: tx.amount,
      memo: tx.memo,
      isSpent: tx.isSpent,
      isChange: tx.isChange,
    })),
    [
      {
        type: "incoming",
        amount: 5_000_000,
        memo: "Shield",
        isSpent: true,
        isChange: false,
      },
      {
        type: "incoming",
        amount: 3_000_000,
        memo: undefined,
        isSpent: true,
        isChange: true,
      },
      {
        type: "outgoing",
        amount: 1_000_000,
        memo: "Transfer",
        isSpent: undefined,
        isChange: false,
      },
      {
        type: "incoming",
        amount: 2_000_000,
        memo: undefined,
        isSpent: false,
        isChange: true,
      },
    ],
  );
});

test("shieldToUser, transferToAlice, and unshieldToUser validate amounts, preload params before sending, and use wait-for-user step", async () => {
  const saplingModule = await import("@/modules/tests/tests/sapling/sapling");

  const resetForTesting = (
    saplingModule as unknown as {
      resetSaplingRuntimeForTesting: (loader?: () => Promise<unknown>) => void;
    }
  ).resetSaplingRuntimeForTesting;

  assert.equal(typeof resetForTesting, "function");

  const progressSteps: string[] = [];
  const recordedDiagrams: Array<{ testId: string; key?: string }> = [];
  const recordedContractDetails: Array<Record<string, unknown>> = [];
  let recordedEstimate: unknown = null;

  resetForTesting(async () => ({
    initSapling: async () => {},
    preloadSaplingParams: async () => {},
    SaplingToolkit: class {
      constructor(_keys: unknown, contractDetails: Record<string, unknown>) {
        recordedContractDetails.push(contractDetails);
      }
      async prepareShieldedTransaction() {
        return "00deadbeef";
      }
      async prepareSaplingTransaction() {
        return "00cafebabe";
      }
      async prepareUnshieldedTransaction() {
        return "00feedface";
      }
    },
  }));

  const fakeUserKey = {
    spendingKey: {} as never,
    address: USER_ADDRESS,
    mnemonic: "test mnemonic",
  };

  const fakeTezos = {
    rpc: {
      getRpcUrl: () => "https://rpc.shadownet.teztnets.com",
    },
    estimate: {
      transfer: async () => ({ suggestedFeeMutez: 1234 }),
    },
    wallet: {
      at: async () => ({
        methodsObject: {
          default: () => ({
            toTransferParams: async () => ({ to: "KT1test", amount: 3 }),
            send: async () => ({
              opHash: "ooTestOpHash123",
              confirmation: async () => {},
            }),
          }),
        },
      }),
    },
  };

  // Invalid amounts must fail immediately before proof generation
  await assert.rejects(
    () =>
      saplingModule.shieldToUser(fakeTezos as never, "KT1test", fakeUserKey, 0),
    /positive/i,
  );
  await assert.rejects(
    () =>
      saplingModule.transferToAlice(
        fakeTezos as never,
        "KT1test",
        fakeUserKey,
        ALICE_ADDRESS,
        -1,
      ),
    /positive/i,
  );
  await assert.rejects(
    () =>
      saplingModule.unshieldToUser(
        fakeTezos as never,
        "KT1test",
        fakeUserKey,
        "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb",
        Number.NaN,
      ),
    /positive/i,
  );

  // Execute shieldToUser with injected diagram/settings hooks or store
  const setHooks = (
    saplingModule as unknown as {
      setSaplingStoreHooksForTesting?: (hooks: {
        setTestDiagram: (testId: string, key?: string) => void;
        setProgress: (step: string) => void;
        setFeeEstimate: (estimate: unknown) => void;
        setOperationHash: (opHash: string) => void;
        setCompleted: () => void;
        getConfirmationCount: () => number;
      }) => void;
    }
  ).setSaplingStoreHooksForTesting;

  assert.equal(
    typeof setHooks,
    "function",
    "Expected sapling.ts to support store hooks for testing",
  );

  setHooks!({
    setTestDiagram: (testId, key) => recordedDiagrams.push({ testId, key }),
    setProgress: (step) => progressSteps.push(step),
    setFeeEstimate: (est) => {
      recordedEstimate = est;
    },
    setOperationHash: () => {},
    setCompleted: () => {},
    getConfirmationCount: () => 1,
  });

  try {
    const opHash = await saplingModule.shieldToUser(
      fakeTezos as never,
      "KT1test",
      fakeUserKey,
      3,
    );

    assert.equal(opHash, "ooTestOpHash123");
    assert.deepEqual(recordedDiagrams, [{ testId: "sapling", key: "shield" }]);
    assert.deepEqual(progressSteps, [
      "prepare-shield",
      "wait-for-user",
      "wait-for-chain-confirmation",
    ]);
    assert.deepEqual(recordedEstimate, { suggestedFeeMutez: 1234 });
    assert.equal(
      saplingModule.getSaplingRuntimeSnapshot().paramsStatus,
      "ready",
      "Proving params should be marked ready by shieldToUser itself",
    );

    await saplingModule.transferToAlice(
      fakeTezos as never,
      "KT1test",
      fakeUserKey,
      ALICE_ADDRESS,
      1,
    );
    await saplingModule.unshieldToUser(
      fakeTezos as never,
      "KT1test",
      fakeUserKey,
      "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb",
      1,
    );

    assert.equal(recordedContractDetails.length, 3);
    for (const details of recordedContractDetails) {
      assert.equal(
        details.outputOrder,
        "randomized",
        "SaplingToolkit should opt in to randomized output ordering",
      );
    }
  } finally {
    resetForTesting();
  }
});

test("sapling UI, metadata, and Playwright spec follow UX and dark-mode guardrails", async () => {
  const [saplingVue, testsTs, helpersTs, saplingSpecTs] = await Promise.all([
    readFile("src/modules/tests/tests/sapling/sapling.vue", "utf8"),
    readFile("src/modules/tests/tests.ts", "utf8"),
    readFile("tests/helpers.ts", "utf8"),
    readFile("tests/sapling.spec.ts", "utf8"),
  ]);

  // 1. sapling.vue should subscribe to runtime snapshot updates so params-preloading UI renders
  assert.match(
    saplingVue,
    /subscribeSaplingRuntimeSnapshot/,
    "sapling.vue must subscribe to runtime snapshot changes so preloading state renders",
  );

  // 2. sapling.vue must not use light-mode-only bg-white result cards that turn white-on-white in dark mode
  assert.doesNotMatch(
    saplingVue,
    /class="rounded-lg border bg-white p-3"/,
    "sapling.vue should not hardcode bg-white on balance/history result boxes",
  );

  // 3. sapling.vue should not hardcode 'tz1' in the Unshield card heading
  assert.doesNotMatch(
    saplingVue,
    /Unshield to Your tz1 Address/,
    "Unshield card title should not assume a tz1 wallet",
  );

  // 4. tests.ts sapling diagrams should use wait-for-user step ID, not call-contract
  const saplingSectionMatch = testsTs.match(
    /sapling:\s*\{[\s\S]*?\n\s+\},\n\};/,
  );
  assert.ok(
    saplingSectionMatch,
    "Could not locate sapling section in tests.ts",
  );
  assert.doesNotMatch(
    saplingSectionMatch[0],
    /id:\s*"call-contract"/,
    "Sapling diagrams in tests.ts should use 'wait-for-user' instead of 'call-contract'",
  );
  assert.match(
    saplingSectionMatch[0],
    /id:\s*"wait-for-user"/,
    "Sapling diagrams in tests.ts should include 'wait-for-user'",
  );

  // 5. tests/helpers.ts waitForSuccess should accept optional timeout
  assert.match(
    helpersTs,
    /waitForSuccess\s*=\s*async\s*\(\{\s*page,\s*timeout/,
    "waitForSuccess in tests/helpers.ts should accept an optional timeout parameter",
  );

  // 6. tests/sapling.spec.ts should assert on history and balance instead of bare waitForTimeout(5000)
  assert.doesNotMatch(
    saplingSpecTs,
    /waitForTimeout\(5000\)/,
    "tests/sapling.spec.ts should use real Playwright assertions instead of waitForTimeout(5000)",
  );
});

test("reloadWithFreshSaplingParams preserves stored session keys unless clearKeys option is true", async () => {
  const saplingModule = await import("@/modules/tests/tests/sapling/sapling");

  const fakeStorageMap = new Map<string, string>();
  const fakeStorage = {
    getItem: (key: string) => fakeStorageMap.get(key) ?? null,
    setItem: (key: string, value: string) => {
      fakeStorageMap.set(key, value);
    },
    removeItem: (key: string) => {
      fakeStorageMap.delete(key);
    },
  };

  const originalWindow = globalThis.window;
  let reloadCount = 0;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      sessionStorage: fakeStorage,
      location: {
        reload: () => {
          reloadCount++;
        },
      },
    },
  });

  try {
    fakeStorage.setItem("sapling:user-mnemonic", "user words");
    fakeStorage.setItem("sapling:alice-mnemonic", "alice words");

    // Default reload should bust proving-params cache WITHOUT wiping keys
    saplingModule.reloadWithFreshSaplingParams();
    assert.equal(reloadCount, 1);
    assert.equal(
      fakeStorage.getItem("sapling:user-mnemonic"),
      "user words",
      "reloadWithFreshSaplingParams() must preserve user mnemonic by default",
    );
    assert.equal(
      fakeStorage.getItem("sapling:alice-mnemonic"),
      "alice words",
      "reloadWithFreshSaplingParams() must preserve Alice mnemonic by default",
    );
    assert.ok(
      fakeStorage.getItem("sapling:fresh-params-reload"),
      "reloadWithFreshSaplingParams() must set the cache-bust token",
    );

    // Explicit { clearKeys: true } should clear keys as well
    saplingModule.reloadWithFreshSaplingParams({ clearKeys: true });
    assert.equal(reloadCount, 2);
    assert.equal(fakeStorage.getItem("sapling:user-mnemonic"), null);
    assert.equal(fakeStorage.getItem("sapling:alice-mnemonic"), null);
  } finally {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  }
});

test("shieldToUser and transferToAlice support custom memos and reject memos exceeding 8 UTF-8 bytes", async () => {
  const saplingModule = await import("@/modules/tests/tests/sapling/sapling");

  const resetForTesting = (
    saplingModule as unknown as {
      resetSaplingRuntimeForTesting: (loader?: () => Promise<unknown>) => void;
    }
  ).resetSaplingRuntimeForTesting;
  const setHooks = (
    saplingModule as unknown as {
      setSaplingStoreHooksForTesting: (hooks: {
        setTestDiagram: (testId: string, key?: string) => void;
        setProgress: (step: string) => void;
        setFeeEstimate: (estimate: unknown) => void;
        setOperationHash: (opHash: string) => void;
        setCompleted: () => void;
        getConfirmationCount: () => number;
      }) => void;
    }
  ).setSaplingStoreHooksForTesting;

  const shieldInputs: Array<
    Array<{ to: string; amount: number; memo?: string }>
  > = [];
  const transferInputs: Array<
    Array<{ to: string; amount: number; memo?: string }>
  > = [];

  resetForTesting(async () => ({
    initSapling: async () => {},
    preloadSaplingParams: async () => {},
    SaplingToolkit: class {
      async prepareShieldedTransaction(
        txs: Array<{ to: string; amount: number; memo?: string }>,
      ) {
        shieldInputs.push(txs);
        return "00deadbeef";
      }
      async prepareSaplingTransaction(
        txs: Array<{ to: string; amount: number; memo?: string }>,
      ) {
        transferInputs.push(txs);
        return "00cafebabe";
      }
    },
  }));

  setHooks({
    setTestDiagram: () => {},
    setProgress: () => {},
    setFeeEstimate: () => {},
    setOperationHash: () => {},
    setCompleted: () => {},
    getConfirmationCount: () => 1,
  });

  const fakeUserKey = {
    spendingKey: {} as never,
    address: USER_ADDRESS,
    mnemonic: "test mnemonic",
  };

  const fakeTezos = {
    rpc: {
      getRpcUrl: () => "https://rpc.shadownet.teztnets.com",
    },
    estimate: {
      transfer: async () => ({ suggestedFeeMutez: 1234 }),
    },
    wallet: {
      at: async () => ({
        methodsObject: {
          default: () => ({
            toTransferParams: async () => ({ to: "KT1test", amount: 3 }),
            send: async () => ({
              opHash: "ooTestOpHash123",
              confirmation: async () => {},
            }),
          }),
        },
      }),
    },
  };

  try {
    await saplingModule.shieldToUser(
      fakeTezos as never,
      "KT1test",
      fakeUserKey,
      2,
      "Note1",
    );

    await saplingModule.transferToAlice(
      fakeTezos as never,
      "KT1test",
      fakeUserKey,
      ALICE_ADDRESS,
      1,
      "PayBob",
    );

    assert.equal(shieldInputs[0]?.[0]?.memo, "Note1");
    assert.equal(transferInputs[0]?.[0]?.memo, "PayBob");

    // Empty / whitespace memo falls back to default "Shield" / "Transfer"
    await saplingModule.shieldToUser(
      fakeTezos as never,
      "KT1test",
      fakeUserKey,
      2,
      "   ",
    );
    assert.equal(shieldInputs[1]?.[0]?.memo, "Shield");

    // Over 8 bytes must reject before running proof
    await assert.rejects(
      () =>
        saplingModule.shieldToUser(
          fakeTezos as never,
          "KT1test",
          fakeUserKey,
          2,
          "123456789",
        ),
      /8 bytes/i,
    );
    await assert.rejects(
      () =>
        saplingModule.transferToAlice(
          fakeTezos as never,
          "KT1test",
          fakeUserKey,
          ALICE_ADDRESS,
          1,
          "123456789",
        ),
      /8 bytes/i,
    );
  } finally {
    resetForTesting();
  }
});

test("sapling IA and UX improvements: 2-column layout, stepped tabs, contract header, masked mnemonic, memo inputs, and viewer perspective toggle", async () => {
  const saplingVue = await readFile(
    "src/modules/tests/tests/sapling/sapling.vue",
    "utf8",
  );

  // 1. Contract header with OpenInExplorer and 8-byte memo badge
  assert.match(
    saplingVue,
    /OpenInExplorer/,
    "sapling.vue should render OpenInExplorer for the deployed Sapling contract",
  );
  assert.match(
    saplingVue,
    /data-testid="sapling-contract-address"/,
    "sapling.vue should expose data-testid='sapling-contract-address'",
  );

  // 2. Two-column workspace layout and stepped Tabs for Shield / Transfer / Unshield
  assert.match(
    saplingVue,
    /lg:grid-cols-12|lg:grid-cols-2/,
    "sapling.vue should use a responsive 2-column grid layout on desktop",
  );
  assert.match(
    saplingVue,
    /TabsTrigger[\s\S]*?value="shield"/,
    "sapling.vue should provide a Shield tab trigger",
  );
  assert.match(
    saplingVue,
    /TabsTrigger[\s\S]*?value="transfer"/,
    "sapling.vue should provide a Transfer tab trigger",
  );
  assert.match(
    saplingVue,
    /TabsTrigger[\s\S]*?value="unshield"/,
    "sapling.vue should provide an Unshield tab trigger",
  );

  // 3. Inline phase-aware feedback during running operations
  assert.match(
    saplingVue,
    /activeOperation/,
    "sapling.vue should track the active operation to show inline button feedback",
  );

  // 4. Masked mnemonic toggle and confirmation guard when userBalance > 0
  assert.match(
    saplingVue,
    /showMnemonicSecret/,
    "sapling.vue should mask the spending key mnemonic by default with a reveal toggle",
  );
  assert.match(
    saplingVue,
    /confirmKeyReplacement|window\.confirm/,
    "sapling.vue should guard against accidental key replacement when userBalance > 0",
  );

  // 5. Memo inputs and history perspective toggle (User vs Alice) plus counterparty address display
  assert.match(
    saplingVue,
    /shieldMemo/,
    "sapling.vue should allow customizing the shield memo",
  );
  assert.match(
    saplingVue,
    /transferMemo/,
    "sapling.vue should allow customizing the private transfer memo",
  );
  assert.match(
    saplingVue,
    /historyPerspective/,
    "sapling.vue should allow toggling transaction history between User and Alice viewing keys",
  );
  assert.match(
    saplingVue,
    /tx\.paymentAddress/,
    "sapling.vue should display the counterparty/recipient Sapling address in transaction history",
  );

  // 6. Auto-advance operation tab after each step so sequential flow and Playwright specs work smoothly,
  //    without resetting the completed diagram status (waitForSuccess relies on diagramComplete)
  assert.match(
    saplingVue,
    /activeOperationTab\.value\s*=\s*"transfer"/,
    "sapling.vue should advance to the transfer tab after shielding",
  );
  assert.match(
    saplingVue,
    /activeOperationTab\.value\s*=\s*"unshield"/,
    "sapling.vue should advance to the unshield tab after transferring to Alice",
  );
  assert.doesNotMatch(
    saplingVue,
    /watch\(activeOperationTab/,
    "sapling.vue must not use watch(activeOperationTab) to reset setTestDiagram when auto-advancing, as that clears diagramStatus='completed' and breaks waitForSuccess",
  );

  // 7. Auto-load shielded balances on mount / wallet connect without locking isRunning
  assert.match(
    saplingVue,
    /loadInitialBalancesIfReady/,
    "sapling.vue should auto-fetch shielded balances in the background once keys and wallet are ready",
  );
});
