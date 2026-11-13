import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import type { BeaconWalletEventsStore } from "@/lib/walletEvents";
import { FakeBeaconWallet } from "@/modules/tests/fakes/fakeBeaconWallet";
import {
  type AccountInfo,
  BeaconErrorType,
  BeaconMessageType,
  type ErrorResponse,
  NetworkType,
  type OperationResponseOutput,
  Origin,
  PermissionScope,
  type SignPayloadResponseOutput,
  SigningType,
} from "@taquito/beacon-wallet/types";
import { BeaconEvent } from "@taquito/beacon-wallet";
import { ref } from "vue";

test("formatBeaconError formats BeaconErrorType errors, RequestErrorResponse objects, and standard errors", async () => {
  const walletEventsModule = await import("@/lib/walletEvents");
  const formatError = (
    walletEventsModule as unknown as {
      formatBeaconError: (error: unknown) => string;
    }
  ).formatBeaconError;

  assert.equal(
    typeof formatError,
    "function",
    "Expected walletEvents.ts to export formatBeaconError",
  );

  // 1. Local PEER_UNREACHABLE RequestErrorResponse
  const peerUnreachableMsg = formatError({
    type: BeaconMessageType.Error,
    errorType: BeaconErrorType.PEER_UNREACHABLE,
    errorOrigin: "local",
  });
  assert.match(peerUnreachableMsg, /did not respond/i);
  assert.match(peerUnreachableMsg, /check the wallet/i);

  // 2. ABORTED_ERROR RequestErrorResponse
  const abortedMsg = formatError({
    type: BeaconMessageType.Error,
    errorType: BeaconErrorType.ABORTED_ERROR,
    errorOrigin: "wallet",
  });
  assert.match(abortedMsg, /aborted|cancelled|rejected/i);

  // 3. TRANSACTION_INVALID_ERROR with RPC error details
  const txInvalidMsg = formatError({
    type: BeaconMessageType.Error,
    errorType: BeaconErrorType.TRANSACTION_INVALID_ERROR,
    errorData: [
      {
        kind: "permanent",
        id: "proto.024.michelson_v1.script_rejected",
        with: { string: "COUNTER_OVERFLOW" },
      },
    ],
  });
  assert.match(txInvalidMsg, /invalid/i);
  assert.match(txInvalidMsg, /COUNTER_OVERFLOW/);

  // 4. SIGNATURE_TYPE_NOT_SUPPORTED
  const sigNotSupportedMsg = formatError({
    type: BeaconMessageType.Error,
    errorType: BeaconErrorType.SIGNATURE_TYPE_NOT_SUPPORTED,
  });
  assert.match(sigNotSupportedMsg, /sign/i);

  // 5. BeaconError-like Error message "[ABORTED_ERROR]:The action was aborted by the user."
  const beaconErrorInstanceMsg = formatError(
    new Error("[ABORTED_ERROR]:The action was aborted by the user."),
  );
  assert.equal(beaconErrorInstanceMsg, "The action was aborted by the user.");

  // 6. Plain Error and plain object fallback (never "[object Object]")
  assert.equal(formatError(new Error("RPC unreachable")), "RPC unreachable");
  const objectMsg = formatError({ customError: "bad input" });
  assert.doesNotMatch(objectMsg, /\[object Object\]/);
});

const fakeEventsStore = () => {
  const calls = { disconnect: [] as (boolean | undefined)[], refresh: 0 };
  const store: BeaconWalletEventsStore = {
    address: ref<string | undefined>("tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb"),
    isDisconnecting: ref(false),
    hasWallet: () => true,
    disconnectWallet: async (fromWallet?: boolean) => {
      calls.disconnect.push(fromWallet);
      store.address.value = undefined;
    },
    refreshWalletDisplay: async () => {
      calls.refresh += 1;
    },
  };
  return { store, calls };
};

const activeAccount: AccountInfo = {
  accountIdentifier: "acc-1",
  senderId: "peer-1",
  origin: { type: Origin.P2P, id: "peer-public-key" },
  address: "tz1aSkwEot3L2kmUvcoxzjMomb9mvBNuzFK6",
  publicKey: "edpkuBknW28nW72KG6RoHtYW7p12T6GKc7nAbwYX5m8Wd9sDVC9yav",
  network: { type: NetworkType.MAINNET },
  scopes: [PermissionScope.SIGN, PermissionScope.OPERATION_REQUEST],
  connectedAt: 1,
  walletType: "implicit",
};

const connectionContext = { origin: Origin.P2P, id: "peer-1" };

test("attachBeaconWalletEvents subscribes the three wallet handlers through BeaconWallet.subscribeToEvent", async () => {
  const { attachBeaconWalletEvents } = await import("@/lib/walletEvents");
  const wallet = new FakeBeaconWallet();
  const { store } = fakeEventsStore();

  await attachBeaconWalletEvents(wallet, store);

  for (const event of [
    BeaconEvent.ACTIVE_ACCOUNT_SET,
    BeaconEvent.LATE_RESPONSE_RECEIVED,
    BeaconEvent.INVALID_ACCOUNT_DEACTIVATED,
  ]) {
    assert.equal(wallet.subscriberCount(event), 1, `subscribed to ${event}`);
  }
});

test("ACTIVE_ACCOUNT_SET updates the address and refreshes the wallet name and icon", async () => {
  const { attachBeaconWalletEvents } = await import("@/lib/walletEvents");
  const wallet = new FakeBeaconWallet();
  const { store, calls } = fakeEventsStore();
  await attachBeaconWalletEvents(wallet, store);

  await wallet.emit(BeaconEvent.ACTIVE_ACCOUNT_SET, activeAccount);

  assert.equal(store.address.value, activeAccount.address);
  assert.equal(calls.refresh, 1);
  assert.deepEqual(calls.disconnect, []);
});

test("ACTIVE_ACCOUNT_SET with no account disconnects a connected store from the wallet side", async () => {
  const { attachBeaconWalletEvents } = await import("@/lib/walletEvents");
  const wallet = new FakeBeaconWallet();
  const { store, calls } = fakeEventsStore();
  await attachBeaconWalletEvents(wallet, store);

  await wallet.emit(BeaconEvent.ACTIVE_ACCOUNT_SET, undefined);

  assert.deepEqual(calls.disconnect, [true]);
  assert.equal(calls.refresh, 0);
});

test("INVALID_ACCOUNT_DEACTIVATED resets the store without notifying the wallet", async () => {
  const { attachBeaconWalletEvents } = await import("@/lib/walletEvents");
  const wallet = new FakeBeaconWallet();
  const { store, calls } = fakeEventsStore();
  await attachBeaconWalletEvents(wallet, store);

  await wallet.emit(BeaconEvent.INVALID_ACCOUNT_DEACTIVATED, {
    reason: "storage_validation_failed",
  });

  assert.deepEqual(calls.disconnect, [false]);
});

test("LATE_RESPONSE_RECEIVED handles late operation, signature, and error responses", async () => {
  const { attachBeaconWalletEvents } = await import("@/lib/walletEvents");
  const wallet = new FakeBeaconWallet();
  const { store } = fakeEventsStore();
  await attachBeaconWalletEvents(wallet, store);

  const operationResponse: OperationResponseOutput = {
    type: BeaconMessageType.OperationResponse,
    version: "2",
    id: "req-1",
    senderId: "wallet-1",
    transactionHash: "ooLateOpHash1234567890",
  };
  const signResponse: SignPayloadResponseOutput = {
    type: BeaconMessageType.SignPayloadResponse,
    version: "2",
    id: "req-2",
    senderId: "wallet-1",
    signingType: SigningType.MICHELINE,
    signature: "edsigLateSignature1234567890",
  };
  const errorResponse: ErrorResponse = {
    type: BeaconMessageType.Error,
    version: "2",
    id: "req-3",
    senderId: "wallet-1",
    errorType: BeaconErrorType.ABORTED_ERROR,
  };

  await assert.doesNotReject(async () => {
    await wallet.emit(BeaconEvent.LATE_RESPONSE_RECEIVED, {
      kind: "success",
      requestId: "req-1",
      requestType: BeaconMessageType.OperationRequest,
      message: operationResponse,
      output: operationResponse,
      transactionHash: operationResponse.transactionHash,
      connectionInfo: connectionContext,
      walletInfo: { name: "Kukai" },
    });
    await wallet.emit(BeaconEvent.LATE_RESPONSE_RECEIVED, {
      kind: "success",
      requestId: "req-2",
      requestType: BeaconMessageType.SignPayloadRequest,
      message: signResponse,
      output: signResponse,
      connectionInfo: connectionContext,
      walletInfo: { name: "Temple" },
    });
    await wallet.emit(BeaconEvent.LATE_RESPONSE_RECEIVED, {
      kind: "error",
      requestId: "req-3",
      requestType: BeaconMessageType.OperationRequest,
      message: errorResponse,
      error: { ...errorResponse, errorOrigin: "wallet" },
      connectionInfo: connectionContext,
      walletInfo: { name: "Kukai" },
    });
  });
});

test("attachBeaconWalletEvents cleanup removes every handler so re-initialization does not stack them", async () => {
  const { attachBeaconWalletEvents } = await import("@/lib/walletEvents");
  const wallet = new FakeBeaconWallet();
  const first = fakeEventsStore();
  const second = fakeEventsStore();

  const cleanupFirst = await attachBeaconWalletEvents(wallet, first.store);
  cleanupFirst();
  cleanupFirst();
  await attachBeaconWalletEvents(wallet, second.store);

  assert.equal(wallet.eventUnsubscribes, 3);
  await wallet.emit(BeaconEvent.ACTIVE_ACCOUNT_SET, activeAccount);
  assert.equal(first.calls.refresh, 0, "detached handlers must not run");
  assert.equal(second.calls.refresh, 1);
});

test("the wallet store resolves wallet display through getWalletInfo and exposes the icon", async () => {
  const createWalletStoreTs = await readFile(
    "src/stores/createWalletStore.ts",
    "utf8",
  );

  assert.doesNotMatch(
    createWalletStoreTs,
    /matchedPeer|client\.getPeers\(\)/,
    "the manual peer lookup is replaced by BeaconWallet.getWalletInfo()",
  );
  assert.match(createWalletStoreTs, /resolveBeaconWalletDisplay/);
  assert.match(
    createWalletStoreTs,
    /getWalletIcon/,
    "the store exposes the resolved wallet icon",
  );
});

test("the wallet store attaches Beacon subscriptions before pairing and releases them on reset", async () => {
  const createWalletStoreTs = await readFile(
    "src/stores/createWalletStore.ts",
    "utf8",
  );

  const attachCollector = createWalletStoreTs.indexOf("attachBeaconCollector(");
  const requestPermissions = createWalletStoreTs.indexOf(
    "beaconWallet.requestPermissions(",
  );
  assert.ok(attachCollector >= 0, "the store attaches the inspector collector");
  assert.ok(
    attachCollector < requestPermissions,
    "the collector must be attached before pairing so PAIR_INIT is recorded",
  );
  assert.match(createWalletStoreTs, /attachBeaconWalletEvents\(/);
  assert.doesNotMatch(createWalletStoreTs, /initializeBeaconEvents/);

  const resetStart = createWalletStoreTs.indexOf("const resetWalletState");
  const resetEnd = createWalletStoreTs.indexOf("\n    };\n", resetStart);
  assert.ok(resetStart >= 0 && resetEnd > resetStart);
  assert.match(
    createWalletStoreTs.slice(resetStart, resetEnd),
    /releaseBeaconSubscriptions\(\)/,
    "resetWalletState releases the wallet event handlers and the collector",
  );
});

test("standalone @taquito/wallet-connect is removed across codebase and Beacon handles WalletConnect", async () => {
  const [
    pkgJson,
    walletTypesTs,
    networkTypesTs,
    networkRegistryTs,
    appVue,
    createWalletStoreTs,
    walletStoreTs,
    tezlinkWalletStoreTs,
    walletControlVue,
    tezlinkDialogVue,
    signPayloadTs,
  ] = await Promise.all([
    readFile("package.json", "utf8"),
    readFile("src/types/wallet.ts", "utf8"),
    readFile("src/types/network.ts", "utf8"),
    readFile("src/networks/network-registry.ts", "utf8"),
    readFile("src/App.vue", "utf8"),
    readFile("src/stores/createWalletStore.ts", "utf8"),
    readFile("src/stores/walletStore.ts", "utf8"),
    readFile("src/stores/tezlinkWalletStore.ts", "utf8"),
    readFile("src/components/wallet-control.vue", "utf8"),
    readFile(
      "src/modules/tests/tests/tezlink-bridge/TezlinkWalletDialog.vue",
      "utf8",
    ),
    readFile("src/modules/tests/tests/sign-payload/sign-payload.ts", "utf8"),
  ]);

  assert.doesNotMatch(pkgJson, /@taquito\/wallet-connect/);
  assert.doesNotMatch(walletTypesTs, /walletconnect/);
  assert.doesNotMatch(networkTypesTs, /WalletConnectNetworkType/);
  assert.doesNotMatch(networkRegistryTs, /WalletConnectNetworkType/);
  assert.doesNotMatch(
    appVue,
    /initializeWallet\("walletconnect"\)/,
    "App.vue should not initialize standalone walletconnect provider",
  );
  assert.doesNotMatch(createWalletStoreTs, /@taquito\/wallet-connect/);
  assert.doesNotMatch(createWalletStoreTs, /enableMetrics/);
  assert.match(createWalletStoreTs, /DAppClientOptions/);
  assert.doesNotMatch(walletStoreTs, /initializeWalletConnectEvents/);
  assert.doesNotMatch(tezlinkWalletStoreTs, /initializeWalletConnectEvents/);
  assert.doesNotMatch(
    walletControlVue,
    /<SelectItem value="walletconnect">/,
    "wallet-control.vue should not offer standalone walletconnect SelectItem",
  );
  assert.doesNotMatch(
    tezlinkDialogVue,
    /selectedOption === 'walletconnect'/,
    "TezlinkWalletDialog.vue should not offer standalone walletconnect card",
  );
  assert.doesNotMatch(signPayloadTs, /@taquito\/wallet-connect/);
  assert.match(signPayloadTs, /RequestSignPayloadInput/);
});

test("getWalletConfirmationMessage suppresses in-memory signers and uses active wallet name when available", async () => {
  const [walletEventsModule, createWalletStoreTs, walletEventsTs] =
    await Promise.all([
      import("@/lib/walletEvents"),
      readFile("src/stores/createWalletStore.ts", "utf8"),
      readFile("src/lib/walletEvents.ts", "utf8"),
    ]);

  const getConfirmationMessage = (
    walletEventsModule as unknown as {
      getWalletConfirmationMessage: (
        provider?: "beacon" | "programmatic" | "ledger" | "web3auth",
        walletName?: string,
      ) => string | null;
    }
  ).getWalletConfirmationMessage;

  assert.equal(
    typeof getConfirmationMessage,
    "function",
    "Expected walletEvents.ts to export getWalletConfirmationMessage",
  );

  // In-memory providers should not prompt user to check an external wallet
  assert.equal(
    getConfirmationMessage("programmatic", "Raw Private Key Access"),
    null,
  );
  assert.equal(getConfirmationMessage("web3auth", "Web3Auth (Alice)"), null);

  // Named external wallets should be named in the prompt
  assert.equal(
    getConfirmationMessage("beacon", "Kukai Wallet"),
    "Check Kukai Wallet to confirm the operation",
  );
  assert.equal(
    getConfirmationMessage("ledger", "Ledger Device"),
    "Check Ledger Device to confirm the operation",
  );

  // Missing or blank wallet names fall back to "your wallet"
  assert.equal(
    getConfirmationMessage("beacon", undefined),
    "Check your wallet to confirm the operation",
  );
  assert.equal(
    getConfirmationMessage("beacon", "   "),
    "Check your wallet to confirm the operation",
  );

  // createWalletStore.ts should type getProvider with WalletProvider, leave unknown Beacon
  // peer names as undefined, and reference ecadlabs/beacon-sdk-taquito-patches/issues/136
  assert.match(
    createWalletStoreTs,
    /getProvider:\s*ComputedRef<WalletProvider\s*\|\s*undefined>/,
    "Expected createWalletStore.ts to type getProvider as ComputedRef<WalletProvider | undefined>",
  );
  assert.match(
    createWalletStoreTs,
    /ecadlabs\/beacon-sdk-taquito-patches\/issues\/136/,
    "Expected createWalletStore.ts to reference ecadlabs/beacon-sdk-taquito-patches/issues/136",
  );
  assert.doesNotMatch(
    createWalletStoreTs,
    /walletName\.value\s*=\s*"unknown"/,
    "createWalletStore.ts should use undefined instead of magic string 'unknown' for walletName",
  );
  assert.doesNotMatch(
    createWalletStoreTs,
    /\?\?\s*"Beacon Wallet"/,
    "createWalletStore.ts should not fall back to magic string 'Beacon Wallet'",
  );

  // walletEvents.ts should reference #136 and not filter magic placeholder strings
  assert.match(
    walletEventsTs,
    /ecadlabs\/beacon-sdk-taquito-patches\/issues\/136/,
    "Expected walletEvents.ts to reference ecadlabs/beacon-sdk-taquito-patches/issues/136",
  );
  assert.doesNotMatch(
    walletEventsTs,
    /normalizedName !== "Beacon Wallet"/,
    "walletEvents.ts should rely on WalletProvider and optional walletName instead of string blacklists",
  );
});

test("style.css anchors beacon-toast to viewport and references beacon-sdk-taquito-patches#134", async () => {
  const styleCss = await readFile("src/style.css", "utf8");

  assert.match(
    styleCss,
    /ecadlabs\/beacon-sdk-taquito-patches\/issues\/134/,
    "Expected src/style.css to reference ecadlabs/beacon-sdk-taquito-patches/issues/134",
  );
  assert.match(
    styleCss,
    /beacon-toast\s*\{[\s\S]*?position:\s*fixed;[\s\S]*?top:\s*0;[\s\S]*?left:\s*0;[\s\S]*?right:\s*0;[\s\S]*?z-index:\s*1000000;/,
    "Expected src/style.css to anchor beacon-toast with position: fixed at the top of the viewport",
  );
});

test("wallet-signing tests use estimate-fees and wait-for-user steps consistently", async () => {
  const [
    testsTs,
    diagramStoreTs,
    counterTs,
    fa2TokenTs,
    complexParamsTs,
    contractEventsTs,
    etherlinkBridgeTs,
    tezlinkBridgeTs,
  ] = await Promise.all([
    readFile("src/modules/tests/tests.ts", "utf8"),
    readFile("src/stores/diagramStore.ts", "utf8"),
    readFile("src/modules/tests/tests/counter/counter-contract.ts", "utf8"),
    readFile("src/modules/tests/tests/fa2-token/fa2-token.ts", "utf8"),
    readFile(
      "src/modules/tests/tests/complex-parameters/complex-parameters.ts",
      "utf8",
    ),
    readFile(
      "src/modules/tests/tests/contract-events/contract-events.ts",
      "utf8",
    ),
    readFile(
      "src/modules/tests/tests/etherlink-bridge/etherlink-bridge.ts",
      "utf8",
    ),
    readFile(
      "src/modules/tests/tests/tezlink-bridge/tezlink-bridge.ts",
      "utf8",
    ),
  ]);

  // diagramStore.ts should use getWalletConfirmationMessage for wait-for-user
  assert.match(
    diagramStoreTs,
    /getWalletConfirmationMessage/,
    "Expected diagramStore.ts to use getWalletConfirmationMessage for wait-for-user toasts",
  );

  // counter-contract.ts should report estimate-fees and wait-for-user instead of execute-operation
  assert.doesNotMatch(
    counterTs,
    /setProgress\("execute-operation"\)/,
    "counter-contract.ts should use wait-for-user instead of execute-operation",
  );
  assert.equal(
    (counterTs.match(/setProgress\("estimate-fees"\)/g) ?? []).length,
    3,
    "counter-contract.ts should report estimate-fees in increment, decrement, and reset",
  );
  assert.equal(
    (counterTs.match(/setProgress\("wait-for-user"\)/g) ?? []).length,
    3,
    "counter-contract.ts should report wait-for-user in increment, decrement, and reset",
  );

  // fa2-token.ts should use estimate-fees and wait-for-user, and fix get-contracts -> get-contract
  assert.doesNotMatch(
    fa2TokenTs,
    /setProgress\("execute-operation"\)/,
    "fa2-token.ts should use wait-for-user instead of execute-operation",
  );
  assert.doesNotMatch(
    fa2TokenTs,
    /setProgress\("get-contracts"\)/,
    "fa2-token.ts should use get-contract to match its diagram definition",
  );
  assert.doesNotMatch(
    fa2TokenTs,
    /setProgress\("call-balance-of"\)/,
    "fa2-token.ts get-balance-with-callback should use wait-for-user before sending the callback transaction",
  );
  assert.equal(
    (fa2TokenTs.match(/setProgress\("estimate-fees"\)/g) ?? []).length,
    3,
    "fa2-token.ts should report estimate-fees in mint, burn, and transfer",
  );
  assert.equal(
    (fa2TokenTs.match(/setProgress\("wait-for-user"\)/g) ?? []).length,
    4,
    "fa2-token.ts should report wait-for-user in mint, burn, transfer, and get-balance-with-callback",
  );

  // complex-parameters.ts should report estimate-fees and wait-for-user across all 4 write entrypoints
  assert.doesNotMatch(
    complexParamsTs,
    /setProgress\("execute-operation"\)/,
    "complex-parameters.ts should use wait-for-user instead of execute-operation",
  );
  assert.equal(
    (complexParamsTs.match(/setProgress\("estimate-fees"\)/g) ?? []).length,
    4,
    "complex-parameters.ts should report estimate-fees in all 4 write operations",
  );
  assert.equal(
    (complexParamsTs.match(/setProgress\("wait-for-user"\)/g) ?? []).length,
    4,
    "complex-parameters.ts should report wait-for-user in all 4 write operations",
  );

  // contract-events.ts emitEvent should report estimate-fees and wait-for-user
  assert.doesNotMatch(
    contractEventsTs,
    /setProgress\("execute-operation"\)/,
    "contract-events.ts should use wait-for-user instead of execute-operation",
  );
  assert.match(contractEventsTs, /setProgress\("estimate-fees"\)/);
  assert.match(contractEventsTs, /setProgress\("wait-for-user"\)/);

  // etherlink-bridge.ts and tezlink-bridge.ts deposits should report wait-for-user before sending
  assert.doesNotMatch(
    etherlinkBridgeTs,
    /setProgress\("send-deposit-transaction"\)/,
    "etherlink-bridge.ts should use wait-for-user instead of send-deposit-transaction",
  );
  assert.match(etherlinkBridgeTs, /setProgress\("wait-for-user"\)/);
  assert.doesNotMatch(
    tezlinkBridgeTs,
    /setProgress\("send-deposit-transaction"\)/,
    "tezlink-bridge.ts should use wait-for-user instead of send-deposit-transaction",
  );
  assert.match(tezlinkBridgeTs, /setProgress\("wait-for-user"\)/);

  // tests.ts should not use call-balance-of or send-deposit-transaction in diagrams
  assert.doesNotMatch(testsTs, /id:\s*"call-balance-of"/);
  assert.doesNotMatch(testsTs, /id:\s*"send-deposit-transaction"/);
});
