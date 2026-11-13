import assert from "node:assert/strict";
import test from "node:test";
import {
  attachBeaconCollector,
  type BeaconInspectorSource,
} from "@/lib/inspector/beaconCollector";
import { summarizeBeaconMessage } from "@/lib/inspector/beaconMessages";
import { createInspectorLog } from "@/lib/inspector/inspectorLog";
import { toJsonl, toJsonSafe } from "@/lib/inspector/jsonSafe";
import type { InspectorEntryInput } from "@/lib/inspector/types";
import { FakeBeaconWallet } from "@/modules/tests/fakes/fakeBeaconWallet";
import {
  BeaconEvent,
  type BeaconMessageDisposition,
  type BeaconWallet,
  type PendingRequestInfo,
  type RequestSentInfo,
} from "@taquito/beacon-wallet";
import {
  BeaconErrorType,
  BeaconMessageType,
  NetworkType,
  TransportStatus,
  TransportType,
} from "@taquito/beacon-wallet/types";

// Compile-time check: the real BeaconWallet satisfies the collector's source type.
const acceptsRealWallet = (wallet: BeaconWallet): BeaconInspectorSource =>
  wallet;
void acceptsRealWallet;

const SECRET_KEY = "edsk3QoqBuvdamxouPhin7swCvkQNgq4jP5KZPbwWNnwdZpSpJiEbq";
const walletInfo = { name: "Kukai" };

const entryInput = (
  overrides: Partial<InspectorEntryInput> = {},
): InspectorEntryInput => ({
  ts: 1,
  lane: "event",
  kind: "TEST",
  summary: "test",
  payload: null,
  ...overrides,
});

const dispatchInfo = (requestId: string, requestType: BeaconMessageType) => ({
  requestId,
  requestType,
  transport: TransportType.P2P,
  senderId: "peer-1",
  extraInfo: { resetCallback: async () => undefined },
  walletInfo,
});

const sentInfo = (
  requestId: string,
  requestType: BeaconMessageType = BeaconMessageType.OperationRequest,
): RequestSentInfo => ({
  ...dispatchInfo(requestId, requestType),
  dispatchStage: "transport",
  sentAt: 1_000,
});

const forwardedInfo = (
  requestId: string,
  requestType: BeaconMessageType,
  forwardedAt: number,
): RequestSentInfo => ({
  ...dispatchInfo(requestId, requestType),
  dispatchStage: "forwarded",
  forwardedAt,
});

const attach = async (
  wallet: FakeBeaconWallet,
  extra: {
    now?: () => number;
    onPendingRequests?: (pending: readonly PendingRequestInfo[]) => void;
  } = {},
) => {
  const log = createInspectorLog({ capacity: 100 });
  const detach = await attachBeaconCollector(wallet, { log, ...extra });
  return { log, detach };
};

// ---------------------------------------------------------------------------
// Inspector log
// ---------------------------------------------------------------------------

test("inspector log evicts the oldest entries at capacity and keeps seq monotonic", () => {
  const log = createInspectorLog({ capacity: 3 });
  for (let i = 0; i < 5; i += 1) {
    log.append(entryInput({ kind: `K${i}` }));
  }

  const entries = log.entries();
  assert.deepEqual(
    entries.map((entry) => entry.kind),
    ["K2", "K3", "K4"],
  );
  assert.equal(log.evictedCount(), 2);
  assert.ok(entries[0].seq < entries[1].seq && entries[1].seq < entries[2].seq);
});

test("inspector log groups entries by request id in insertion order", () => {
  const log = createInspectorLog({ capacity: 10 });
  log.append(entryInput({ kind: "A", requestId: "req-1" }));
  log.append(entryInput({ kind: "B", requestId: "req-2" }));
  log.append(entryInput({ kind: "C" }));
  log.append(entryInput({ kind: "D", requestId: "req-1" }));

  assert.deepEqual(
    log.forRequest("req-1").map((entry) => entry.kind),
    ["A", "D"],
  );
  assert.deepEqual(log.forRequest("missing"), []);
});

test("inspector log notifies subscribers on append and clear, and unsubscribe is idempotent", () => {
  const log = createInspectorLog({ capacity: 10 });
  let calls = 0;
  const unsubscribe = log.subscribe(() => {
    calls += 1;
  });

  log.append(entryInput());
  log.clear();
  assert.equal(calls, 2);
  assert.deepEqual(log.entries(), []);
  assert.equal(log.evictedCount(), 0);

  unsubscribe();
  unsubscribe();
  log.append(entryInput());
  assert.equal(calls, 2);
});

// ---------------------------------------------------------------------------
// JSON-safe snapshots and export
// ---------------------------------------------------------------------------

test("toJsonSafe replaces functions, promises, bigints, and circular references", () => {
  const circular: { name: string; self?: unknown } = { name: "loop" };
  circular.self = circular;

  const snapshot = toJsonSafe({
    callback: () => undefined,
    pending: Promise.resolve("later"),
    amount: 10n,
    circular,
    missing: undefined,
    list: [1, "two", null],
  });

  assert.deepEqual(snapshot, {
    callback: "[Function]",
    pending: "[Promise]",
    amount: "10",
    circular: { name: "loop", self: "[Circular]" },
    list: [1, "two", null],
  });
});

test("toJsonSafe caps nesting depth", () => {
  const snapshot = toJsonSafe({ a: { b: { c: { d: 1 } } } }, { maxDepth: 2 });
  assert.deepEqual(snapshot, { a: { b: "[MaxDepth]" } });
});

test("toJsonSafe keeps Error name and message", () => {
  const snapshot = toJsonSafe(new TypeError("bad input"));
  assert.deepEqual(snapshot, { name: "TypeError", message: "bad input" });
});

test("toJsonSafe redacts Tezos secret keys of every curve, plain and encrypted, wherever they appear in strings", () => {
  // Shape-valid placeholders: real prefixes, base58 bodies, not real keys.
  const secrets = [
    SECRET_KEY,
    "spsk2rBDDeUqakQ42nBHDGQTtP3GErb6AahHPwF9bhca3Q5KA5HESE",
    "p2sk2obfVMEuPUnadAConLWk7Tf4Dt3n4svSgJwrgpamRqJXvaYcg1",
    "BLsk1hKAHyGqY9qRbgoSVnjiSmDLfLGvcJxhJTx9oBjb4ZW7bEgaAt",
    "edesk1GXwWmGjXiLHBKxGBxwmNvG21vKBh6FBxc4CyJ8adQQE2avP5vBB57ZUZ93Anm7i4k8RmsHaPzVAvpnHkFF",
    "spesk21cruuduwKPzKdvBV3PU3tE7jmCi9Svod2GDE8RSkRvDTr4zB9Q2LmbDkk2uKVDRrnYNb8HYvxv7PjUnTRu",
    "p2esk27ocLPLp1JqSDNGJxL8fHRaMhw4Td6nC9Jw1ZsQNoKWuy7TuaEDhdhPAmAn3UfKkJgYnRSyJcZBVTqHW8B1",
    "BLesk1WKMDyHmMsakRK9xktxa3pbBthrPRYUVD5NhGTCjhgnZChCdQ3FgjbPKmTYHmPkcwvExyRPyHPU4DCcazsZ",
  ];
  const snapshot = toJsonSafe({
    keys: secrets,
    note: `imported ${SECRET_KEY} for testing`,
    nested: [{ deeper: { value: secrets[3] } }],
    publicKey: "edpkuBknW28nW72KG6RoHtYW7p12T6GKc7nAbwYX5m8Wd9sDVC9yav",
    signature:
      "edsigtXomBKi5CTRf5cjATJWSyaRvhfYNHqSUGrn4SdbYRcGwQrUGjzEfQDTuqHhuA8b2d8NarZjz8TRf65WkpQmo423BtomS8Q",
  });

  const serialized = JSON.stringify(snapshot);
  for (const secret of secrets) {
    assert.ok(
      !serialized.includes(secret),
      `${secret.slice(0, 6)} key must be redacted`,
    );
  }
  assert.match(serialized, /imported \[redacted secret key\] for testing/);
  assert.match(
    serialized,
    /edpkuBknW28nW72KG6RoHtYW7p12T6GKc7nAbwYX5m8Wd9sDVC9yav/,
    "public keys are not secrets and must stay visible",
  );
  assert.match(
    serialized,
    /edsigtXomBKi5/,
    "signatures are not secrets and must stay visible",
  );
});

test("toJsonl writes one parseable entry per line", () => {
  const log = createInspectorLog({ capacity: 10 });
  log.append(entryInput({ kind: "A", payload: { x: 1 } }));
  log.append(entryInput({ kind: "B", requestId: "req-1" }));

  const lines = toJsonl(log.entries()).trimEnd().split("\n");
  assert.equal(lines.length, 2);
  const parsed: unknown[] = lines.map((line) => JSON.parse(line));
  assert.deepEqual(parsed[0], { ...log.entries()[0] });
  assert.deepEqual(parsed[1], { ...log.entries()[1] });
});

// ---------------------------------------------------------------------------
// Beacon message guards
// ---------------------------------------------------------------------------

test("summarizeBeaconMessage reads flat V2 messages", () => {
  assert.deepEqual(
    summarizeBeaconMessage({
      id: "req-1",
      type: "operation_request",
      version: "2",
      senderId: "dapp-1",
      network: { type: "mainnet" },
    }),
    { id: "req-1", type: "operation_request", version: "2", protocol: "v2" },
  );
});

test("summarizeBeaconMessage reads V3 BeaconMessageWrapper envelopes", () => {
  assert.deepEqual(
    summarizeBeaconMessage({
      id: "req-2",
      version: "3",
      senderId: "wallet-1",
      message: {
        type: "permission_response",
        blockchainIdentifier: "tezos",
        blockchainData: {},
      },
    }),
    { id: "req-2", type: "permission_response", version: "3", protocol: "v3" },
  );
});

test("summarizeBeaconMessage returns undefined for malformed input instead of throwing", () => {
  for (const malformed of [
    "garbage",
    null,
    undefined,
    42,
    [],
    { id: 5, type: "operation_request", version: "2" },
    { id: "req-3", version: "3", message: "not-an-object" },
    { id: "req-4", version: "2" },
  ]) {
    assert.equal(summarizeBeaconMessage(malformed), undefined);
  }
});

// ---------------------------------------------------------------------------
// Beacon collector
// ---------------------------------------------------------------------------

test("collector subscribes to every BeaconEvent exactly once and to messages", async () => {
  const wallet = new FakeBeaconWallet();
  await attach(wallet);

  for (const event of Object.values(BeaconEvent)) {
    assert.equal(wallet.subscriberCount(event), 1, `subscribed to ${event}`);
  }
  assert.equal(wallet.messageListeners.length, 1);
});

test("collector records SENT events with request id, transport time, and dispatch stage", async () => {
  const wallet = new FakeBeaconWallet();
  const { log } = await attach(wallet);

  await wallet.emit(BeaconEvent.OPERATION_REQUEST_SENT, sentInfo("req-1"));
  await wallet.emit(
    BeaconEvent.SIGN_REQUEST_SENT,
    forwardedInfo("req-2", BeaconMessageType.SignPayloadRequest, 2_000),
  );

  const [transportEntry, forwardedEntry] = log.entries();
  assert.equal(transportEntry.lane, "event");
  assert.equal(transportEntry.kind, BeaconEvent.OPERATION_REQUEST_SENT);
  assert.equal(transportEntry.requestId, "req-1");
  assert.equal(transportEntry.ts, 1_000);
  assert.match(transportEntry.summary, /operation_request/);
  assert.match(transportEntry.summary, /p2p/);

  assert.equal(forwardedEntry.requestId, "req-2");
  assert.equal(forwardedEntry.ts, 2_000);
  assert.match(forwardedEntry.summary, /forwarded/);
});

test("collector correlates SENT, outgoing message, ACK, and response by request id", async () => {
  const wallet = new FakeBeaconWallet();
  const { log } = await attach(wallet);

  await wallet.emit(BeaconEvent.OPERATION_REQUEST_SENT, sentInfo("req-1"));
  wallet.emitMessage({
    direction: "outgoing",
    transport: TransportType.P2P,
    senderId: "peer-1",
    ts: 1_001,
    message: {
      id: "req-1",
      type: "operation_request",
      version: "2",
      senderId: "dapp-1",
    },
  });
  await wallet.emit(BeaconEvent.OPERATION_REQUEST_SENT, sentInfo("req-other"));
  await wallet.emit(BeaconEvent.ACKNOWLEDGE_RECEIVED, {
    correlated: true,
    requestId: "req-1",
    receivedAt: 1_100,
    walletInfo,
    extraInfo: {},
    message: {
      type: BeaconMessageType.Acknowledge,
      version: "2",
      id: "req-1",
      senderId: "wallet-1",
    },
  });
  await wallet.emit(BeaconEvent.BLOCKCHAIN_REQUEST_SUCCESS, {
    requestId: "req-1",
    receivedAt: 1_200,
    walletInfo,
  });

  const correlated = log.forRequest("req-1");
  assert.deepEqual(
    correlated.map((entry) => [entry.lane, entry.kind, entry.ts]),
    [
      ["event", BeaconEvent.OPERATION_REQUEST_SENT, 1_000],
      ["message", "outgoing", 1_001],
      ["event", BeaconEvent.ACKNOWLEDGE_RECEIVED, 1_100],
      ["event", BeaconEvent.BLOCKCHAIN_REQUEST_SUCCESS, 1_200],
    ],
  );
});

test("collector keeps an uncorrelated WalletConnect ACK unattributed", async () => {
  const wallet = new FakeBeaconWallet();
  const { log } = await attach(wallet);

  await wallet.emit(BeaconEvent.ACKNOWLEDGE_RECEIVED, {
    correlated: false,
    receivedAt: 1_500,
    walletInfo,
    extraInfo: {},
  });

  const [entry] = log.entries();
  assert.equal(entry.requestId, undefined);
  assert.equal(entry.ts, 1_500);
  assert.match(entry.summary, /uncorrelated/i);
});

test("collector records error responses and WAITING_FOR_WALLET_ACK against the request", async () => {
  const wallet = new FakeBeaconWallet();
  const { log } = await attach(wallet);

  await wallet.emit(BeaconEvent.WAITING_FOR_WALLET_ACK, {
    requestId: "req-9",
    transport: TransportType.P2P,
    elapsedMs: 5_000,
  });
  await wallet.emit(BeaconEvent.SIGN_REQUEST_ERROR, {
    requestId: "req-9",
    receivedAt: 9_000,
    walletInfo,
    errorResponse: {
      id: "req-9",
      version: "2",
      senderId: "wallet-1",
      type: BeaconMessageType.Error,
      errorType: BeaconErrorType.ABORTED_ERROR,
      errorOrigin: "wallet",
    },
  });

  const kinds = log.forRequest("req-9").map((entry) => entry.kind);
  assert.deepEqual(kinds, [
    BeaconEvent.WAITING_FOR_WALLET_ACK,
    BeaconEvent.SIGN_REQUEST_ERROR,
  ]);
  assert.match(log.forRequest("req-9")[1].summary, /ABORTED_ERROR/);
});

test("collector puts transport status changes in the connection lane", async () => {
  const wallet = new FakeBeaconWallet();
  const { log } = await attach(wallet, { now: () => 7_000 });

  await wallet.emit(BeaconEvent.TRANSPORT_STATUS_CHANGED, {
    transport: TransportType.P2P,
    status: TransportStatus.CONNECTED,
    previous: TransportStatus.CONNECTED,
    health: "degraded",
    reason: "sync_failing",
    relayServer: "beacon-node-1.example.com",
  });

  const [entry] = log.entries();
  assert.equal(entry.lane, "connection");
  assert.equal(entry.ts, 7_000);
  assert.match(entry.summary, /degraded/);
  assert.match(entry.summary, /sync_failing/);
});

test("collector records incoming messages, including malformed ones, without throwing", async () => {
  const wallet = new FakeBeaconWallet();
  const { log } = await attach(wallet);

  wallet.emitMessage({
    direction: "incoming",
    transport: TransportType.WALLETCONNECT,
    ts: 3_000,
    message: {
      id: "req-5",
      version: "3",
      senderId: "wallet-1",
      message: { type: "permission_response", blockchainIdentifier: "tezos" },
    },
  });
  wallet.emitMessage({
    direction: "incoming",
    transport: TransportType.P2P,
    ts: 3_100,
    message: "not json at all",
  });

  const [v3Entry, malformedEntry] = log.entries();
  assert.equal(v3Entry.lane, "message");
  assert.equal(v3Entry.kind, "incoming");
  assert.equal(v3Entry.requestId, "req-5");
  assert.match(v3Entry.summary, /permission_response/);

  assert.equal(malformedEntry.requestId, undefined);
  assert.equal(malformedEntry.ts, 3_100);
  assert.match(malformedEntry.summary, /unrecognized/i);
  assert.deepEqual(malformedEntry.payload, {
    direction: "incoming",
    transport: TransportType.P2P,
    ts: 3_100,
    message: "not json at all",
  });
});

test("collector records the SDK's routing outcome for incoming messages as its own entry", async () => {
  const wallet = new FakeBeaconWallet();
  const { log } = await attach(wallet);
  const response = {
    id: "req-9",
    version: "2",
    senderId: "wallet-1",
    type: "operation_response",
    transactionHash: "oo1",
  };

  // Beacon emits each incoming message twice: at the boundary, then with a
  // disposition once handleResponse has routed it.
  wallet.emitMessage({
    direction: "incoming",
    transport: TransportType.P2P,
    ts: 5_000,
    message: response,
  });
  wallet.emitMessage({
    direction: "incoming",
    transport: TransportType.P2P,
    ts: 5_001,
    message: response,
    disposition: "unknown-request",
  });
  wallet.emitMessage({
    direction: "incoming",
    transport: TransportType.P2P,
    ts: 5_002,
    message: "not json at all",
    disposition: "invalid",
  });

  const [boundary, routed, invalid] = log.entries();
  assert.equal(boundary.kind, "incoming");

  assert.equal(routed.lane, "message");
  assert.equal(routed.kind, "incoming:unknown-request");
  assert.equal(routed.requestId, "req-9");
  assert.equal(routed.ts, 5_001);
  assert.match(routed.summary, /operation_response/);
  assert.match(routed.summary, /no open request/i);

  assert.equal(invalid.kind, "incoming:invalid");
  assert.equal(invalid.requestId, undefined);
  assert.match(invalid.summary, /invalid/i);
});

test("collector describes every incoming message disposition", async () => {
  const wallet = new FakeBeaconWallet();
  const { log } = await attach(wallet);
  const dispositions: BeaconMessageDisposition[] = [
    "handled",
    "stale",
    "unknown-request",
    "invalid",
  ];
  for (const disposition of dispositions) {
    wallet.emitMessage({
      direction: "incoming",
      transport: TransportType.P2P,
      ts: 6_000,
      message: { id: "req-10", version: "2", type: "sign_payload_response" },
      disposition,
    });
  }

  const summaries = log.entries().map((entry) => entry.summary);
  assert.match(summaries[0], /matched an open request/i);
  assert.match(summaries[1], /after the request timed out/i);
  assert.match(summaries[2], /no open request/i);
  assert.match(summaries[3], /invalid/i);
});

test("collector stores JSON-safe snapshots of PAIR_INIT, which carries promises and callbacks", async () => {
  const wallet = new FakeBeaconWallet();
  const { log } = await attach(wallet, { now: () => 4_000 });

  await wallet.emit(BeaconEvent.PAIR_INIT, {
    p2pPeerInfo: Promise.resolve("p2p-pairing"),
    postmessagePeerInfo: Promise.resolve("postmessage-pairing"),
    walletConnectPeerInfo: Promise.resolve("wc-pairing"),
    networkType: NetworkType.MAINNET,
    abortedHandler: () => undefined,
    analytics: { track: () => undefined },
  });

  const [entry] = log.entries();
  assert.equal(entry.ts, 4_000);
  assert.deepEqual(JSON.parse(JSON.stringify(entry.payload)), entry.payload);
});

test("collector snapshots ACTIVE_TRANSPORT_SET as type and status only", async () => {
  class FakeTransport {
    readonly type = TransportType.P2P;
    readonly self: FakeTransport;
    constructor() {
      this.self = this;
    }
    get connectionStatus(): TransportStatus {
      return TransportStatus.CONNECTED;
    }
    connect(): void {}
  }

  const wallet = new FakeBeaconWallet();
  const { log } = await attach(wallet);
  await wallet.emit(BeaconEvent.ACTIVE_TRANSPORT_SET, new FakeTransport());

  const [entry] = log.entries();
  assert.equal(entry.lane, "connection");
  assert.deepEqual(entry.payload, {
    type: TransportType.P2P,
    connectionStatus: TransportStatus.CONNECTED,
  });
});

test("collector never stores secret keys that reach a payload", async () => {
  const wallet = new FakeBeaconWallet();
  const { log } = await attach(wallet);

  await wallet.emit(
    BeaconEvent.GENERIC_ERROR,
    `failed to import ${SECRET_KEY}`,
  );

  assert.doesNotMatch(JSON.stringify(log.entries()), /edsk3Qoq/);
});

test("collector refreshes the pending request snapshot after each event and message", async () => {
  const wallet = new FakeBeaconWallet();
  const snapshots: (readonly PendingRequestInfo[])[] = [];
  await attach(wallet, {
    onPendingRequests: (pending) => {
      snapshots.push(pending);
    },
  });

  wallet.pending = [
    {
      id: "req-1",
      type: BeaconMessageType.OperationRequest,
      transport: TransportType.P2P,
      senderId: "peer-1",
      sentAt: 1_000,
      acknowledged: false,
    },
  ];
  await wallet.emit(BeaconEvent.OPERATION_REQUEST_SENT, sentInfo("req-1"));
  wallet.pending = [];
  wallet.emitMessage({
    direction: "incoming",
    transport: TransportType.P2P,
    ts: 1_300,
    message: { id: "req-1", type: "operation_response", version: "2" },
  });

  assert.equal(snapshots.length, 2);
  assert.equal(snapshots[0][0]?.id, "req-1");
  assert.deepEqual(snapshots[1], []);
});

test("collector detach removes every subscription it made", async () => {
  const wallet = new FakeBeaconWallet();
  const { detach } = await attach(wallet);

  detach();
  detach();

  assert.equal(wallet.eventUnsubscribes, Object.values(BeaconEvent).length);
  assert.equal(wallet.messageUnsubscribes, 1);
  for (const event of Object.values(BeaconEvent)) {
    assert.equal(wallet.subscriberCount(event), 0);
  }
});

test("collector re-attached after detach records each event once", async () => {
  const wallet = new FakeBeaconWallet();
  const log = createInspectorLog({ capacity: 100 });

  const detachFirst = await attachBeaconCollector(wallet, { log });
  detachFirst();
  await attachBeaconCollector(wallet, { log });

  await wallet.emit(BeaconEvent.HIDE_UI, ["alert"]);
  assert.equal(log.entries().length, 1);
});
