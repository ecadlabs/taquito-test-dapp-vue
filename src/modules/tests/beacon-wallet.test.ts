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
