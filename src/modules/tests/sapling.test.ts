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
  let recordedEstimate: unknown = null;

  resetForTesting(async () => ({
    initSapling: async () => {},
    preloadSaplingParams: async () => {},
    SaplingToolkit: class {
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
