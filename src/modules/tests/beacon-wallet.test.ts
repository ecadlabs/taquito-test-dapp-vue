import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  BeaconErrorType,
  BeaconMessageType,
  SigningType,
} from "@taquito/beacon-wallet/types";
import { BeaconEvent } from "@taquito/beacon-wallet";

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

test("initializeBeaconEvents subscribes to ACTIVE_ACCOUNT_SET, LATE_RESPONSE_RECEIVED, and INVALID_ACCOUNT_DEACTIVATED", async () => {
  const { initializeBeaconEvents } = await import("@/lib/walletEvents");

  const subscriptions = new Map<
    string,
    (payload: unknown) => Promise<void> | void
  >();
  let disconnectCalls = 0;
  let lastDisconnectFromWallet: boolean | undefined;

  const fakeBeaconWallet = {
    client: {
      subscribeToEvent: async (
        event: string,
        handler: (payload: unknown) => Promise<void> | void,
      ) => {
        subscriptions.set(event, handler);
      },
    },
  };

  const fakeStore = {
    address: { value: "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb" },
    isDisconnecting: { value: false },
    disconnectWallet: async (fromWallet?: boolean) => {
      disconnectCalls += 1;
      lastDisconnectFromWallet = fromWallet;
      fakeStore.address.value = undefined as unknown as string;
    },
  };

  initializeBeaconEvents(fakeBeaconWallet as never, fakeStore as never);

  assert.ok(
    subscriptions.has(BeaconEvent.ACTIVE_ACCOUNT_SET),
    "Should subscribe to BeaconEvent.ACTIVE_ACCOUNT_SET",
  );
  assert.ok(
    subscriptions.has(BeaconEvent.LATE_RESPONSE_RECEIVED),
    "Should subscribe to BeaconEvent.LATE_RESPONSE_RECEIVED",
  );
  assert.ok(
    subscriptions.has(BeaconEvent.INVALID_ACCOUNT_DEACTIVATED),
    "Should subscribe to BeaconEvent.INVALID_ACCOUNT_DEACTIVATED",
  );

  // Trigger INVALID_ACCOUNT_DEACTIVATED when active account storage fails validation
  const invalidAccountHandler = subscriptions.get(
    BeaconEvent.INVALID_ACCOUNT_DEACTIVATED,
  )!;
  await invalidAccountHandler({ reason: "storage_validation_failed" });
  assert.equal(
    disconnectCalls,
    1,
    "INVALID_ACCOUNT_DEACTIVATED should reset/disconnect active wallet state",
  );
  assert.equal(lastDisconnectFromWallet, false);

  // Trigger LATE_RESPONSE_RECEIVED for both success (operation & sign) and error
  const lateResponseHandler = subscriptions.get(
    BeaconEvent.LATE_RESPONSE_RECEIVED,
  )!;
  await assert.doesNotReject(async () => {
    await lateResponseHandler({
      kind: "success",
      requestId: "req-1",
      requestType: BeaconMessageType.OperationRequest,
      transactionHash: "ooLateOpHash1234567890",
      output: {
        type: BeaconMessageType.OperationResponse,
        transactionHash: "ooLateOpHash1234567890",
      },
      walletInfo: { name: "Kukai" },
    });
    await lateResponseHandler({
      kind: "success",
      requestId: "req-2",
      requestType: BeaconMessageType.SignPayloadRequest,
      output: {
        type: BeaconMessageType.SignPayloadResponse,
        signingType: SigningType.MICHELINE,
        signature: "edsigLateSignature1234567890",
      },
      walletInfo: { name: "Temple" },
    });
    await lateResponseHandler({
      kind: "error",
      requestId: "req-3",
      requestType: BeaconMessageType.OperationRequest,
      error: {
        id: "req-3",
        version: "2",
        senderId: "peer-1",
        type: BeaconMessageType.Error,
        errorType: BeaconErrorType.ABORTED_ERROR,
        errorOrigin: "wallet",
      },
      walletInfo: { name: "Kukai" },
    });
  });
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
  const walletEventsModule = await import("@/lib/walletEvents");
  const getConfirmationMessage = (
    walletEventsModule as unknown as {
      getWalletConfirmationMessage: (
        provider?: string,
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

  // Generic or missing wallet names fall back to "your wallet"
  assert.equal(
    getConfirmationMessage("beacon", "Beacon Wallet"),
    "Check your wallet to confirm the operation",
  );
  assert.equal(
    getConfirmationMessage("beacon", "unknown"),
    "Check your wallet to confirm the operation",
  );
  assert.equal(
    getConfirmationMessage("beacon", undefined),
    "Check your wallet to confirm the operation",
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
