import {
  BeaconEvent,
  type BeaconMessageDisposition,
  type BeaconMessageRecord,
  type BeaconWallet,
  type PendingRequestInfo,
} from "@taquito/beacon-wallet";
import { summarizeBeaconMessage } from "./beaconMessages";
import type { InspectorLog } from "./inspectorLog";
import { redactSecrets, toJsonSafe } from "./jsonSafe";
import type { InspectorEntryInput, InspectorLane, JsonValue } from "./types";

/** The parts of `BeaconWallet` the collector reads. */
export type BeaconInspectorSource = Pick<
  BeaconWallet,
  "subscribeToEvent" | "subscribeToMessages" | "getPendingRequests"
>;

export interface BeaconCollectorOptions {
  log: InspectorLog;
  /** Clock for entries whose payload carries no timestamp. */
  now?: () => number;
  /**
   * Called with a fresh `getPendingRequests()` snapshot after each event or
   * message.
   */
  onPendingRequests?: (pending: readonly PendingRequestInfo[]) => void;
}

// Event payloads arrive as a union over every BeaconEvent, so the collector
// reads fields structurally instead of narrowing per event.
const field = (value: unknown, key: string): unknown =>
  typeof value === "object" && value !== null && key in value
    ? Reflect.get(value, key)
    : undefined;

const stringField = (value: unknown, key: string): string | undefined => {
  const result = field(value, key);
  return typeof result === "string" ? result : undefined;
};

const numberField = (value: unknown, key: string): number | undefined => {
  const result = field(value, key);
  return typeof result === "number" ? result : undefined;
};

const CONNECTION_EVENTS: ReadonlySet<BeaconEvent> = new Set([
  BeaconEvent.ACTIVE_TRANSPORT_SET,
  BeaconEvent.TRANSPORT_STATUS_CHANGED,
]);

const eventTimestamp = (data: unknown): number | undefined =>
  numberField(data, "sentAt") ??
  numberField(data, "forwardedAt") ??
  numberField(data, "receivedAt");

const describeEvent = (event: BeaconEvent, data: unknown): string => {
  switch (event) {
    case BeaconEvent.PERMISSION_REQUEST_SENT:
    case BeaconEvent.PROOF_OF_EVENT_CHALLENGE_REQUEST_SENT:
    case BeaconEvent.SIMULATED_PROOF_OF_EVENT_CHALLENGE_REQUEST_SENT:
    case BeaconEvent.OPERATION_REQUEST_SENT:
    case BeaconEvent.SIGN_REQUEST_SENT:
    case BeaconEvent.BROADCAST_REQUEST_SENT: {
      const type = stringField(data, "requestType") ?? "request";
      const transport = stringField(data, "transport") ?? "unknown transport";
      return field(data, "dispatchStage") === "forwarded"
        ? `${type} forwarded to the leader tab for ${transport}`
        : `${type} sent via ${transport}`;
    }
    case BeaconEvent.PERMISSION_REQUEST_ERROR:
    case BeaconEvent.PROOF_OF_EVENT_CHALLENGE_REQUEST_ERROR:
    case BeaconEvent.SIMULATED_PROOF_OF_EVENT_CHALLENGE_REQUEST_ERROR:
    case BeaconEvent.OPERATION_REQUEST_ERROR:
    case BeaconEvent.SIGN_REQUEST_ERROR:
    case BeaconEvent.BROADCAST_REQUEST_ERROR: {
      const error = field(data, "errorResponse");
      const errorType = stringField(error, "errorType") ?? "unknown error";
      const origin = stringField(error, "errorOrigin");
      return origin ? `${errorType} (${origin})` : errorType;
    }
    case BeaconEvent.PERMISSION_REQUEST_SUCCESS:
      return `permission granted for ${stringField(field(data, "account"), "address") ?? "account"}`;
    case BeaconEvent.OPERATION_REQUEST_SUCCESS:
    case BeaconEvent.BROADCAST_REQUEST_SUCCESS: {
      const hash = stringField(field(data, "output"), "transactionHash");
      return hash ? `operation ${hash}` : "response received";
    }
    case BeaconEvent.PROOF_OF_EVENT_CHALLENGE_REQUEST_SUCCESS:
    case BeaconEvent.SIMULATED_PROOF_OF_EVENT_CHALLENGE_REQUEST_SUCCESS:
    case BeaconEvent.SIGN_REQUEST_SUCCESS:
    case BeaconEvent.BLOCKCHAIN_REQUEST_SUCCESS:
      return "response received";
    case BeaconEvent.ACKNOWLEDGE_RECEIVED:
      return field(data, "correlated") === true
        ? "wallet acknowledged the request"
        : "uncorrelated acknowledgement (WalletConnect pairing status)";
    case BeaconEvent.WAITING_FOR_WALLET_ACK:
      return `no acknowledgement after ${numberField(data, "elapsedMs") ?? "?"} ms`;
    case BeaconEvent.LATE_RESPONSE_RECEIVED:
      return `late ${stringField(data, "kind") ?? "response"} after the request timed out`;
    case BeaconEvent.TRANSPORT_STATUS_CHANGED: {
      const reason = stringField(data, "reason");
      const relay = stringField(data, "relayServer");
      return [
        `${stringField(data, "transport")}: ${stringField(data, "previous")} -> ${stringField(data, "status")}`,
        `health ${stringField(data, "health")}`,
        reason ? `reason ${reason}` : undefined,
        relay ? `relay ${relay}` : undefined,
      ]
        .filter((part) => part !== undefined)
        .join(", ");
    }
    case BeaconEvent.ACTIVE_TRANSPORT_SET:
      return data
        ? `active transport ${stringField(data, "type")}`
        : "active transport cleared";
    case BeaconEvent.ACTIVE_ACCOUNT_SET:
      return data
        ? `active account ${stringField(data, "address")}`
        : "active account cleared";
    case BeaconEvent.PAIR_INIT:
      return `pairing started on ${stringField(data, "networkType") ?? "unknown network"}`;
    case BeaconEvent.PAIR_SUCCESS:
      return `paired with ${stringField(data, "name") ?? "wallet"}`;
    case BeaconEvent.CHANNEL_CLOSED:
      return typeof data === "string"
        ? `channel closed: ${data}`
        : "channel closed";
    case BeaconEvent.GENERIC_ERROR:
      return typeof data === "string" ? data : "generic error";
    case BeaconEvent.INTERNAL_ERROR:
      return stringField(data, "text") ?? "internal error";
    case BeaconEvent.INVALID_ACCOUNT_DEACTIVATED:
      return `invalid account deactivated: ${stringField(data, "reason") ?? "no reason"}`;
    case BeaconEvent.HIDE_UI:
      return Array.isArray(data) ? `hide ${data.join(", ")}` : "hide UI";
    case BeaconEvent.SHOW_PREPARE:
      return "preparing request";
    case BeaconEvent.LOCAL_RATE_LIMIT_REACHED:
      return "local rate limit reached";
    case BeaconEvent.NO_PERMISSIONS:
      return "no permissions";
    case BeaconEvent.INVALID_ACTIVE_ACCOUNT_STATE:
      return "invalid active account state";
    case BeaconEvent.RELAYER_ERROR:
      return "relayer error";
    case BeaconEvent.UNKNOWN:
      return "unknown event";
  }
};

const eventPayload = (event: BeaconEvent, data: unknown): JsonValue => {
  // The SDK emits a { type, connectionStatus } snapshot. Copy just those two
  // fields so a richer transport object can never end up in the log.
  if (event === BeaconEvent.ACTIVE_TRANSPORT_SET && data) {
    return toJsonSafe({
      type: field(data, "type"),
      connectionStatus: field(data, "connectionStatus"),
    });
  }
  return toJsonSafe(data);
};

const eventEntry = (
  event: BeaconEvent,
  data: unknown,
  now: () => number,
): InspectorEntryInput => {
  const lane: InspectorLane = CONNECTION_EVENTS.has(event)
    ? "connection"
    : "event";
  const requestId = stringField(data, "requestId");
  return {
    ts: eventTimestamp(data) ?? now(),
    lane,
    kind: event,
    ...(requestId !== undefined ? { requestId } : {}),
    summary: redactSecrets(describeEvent(event, data)),
    payload: eventPayload(event, data),
  };
};

const describeDisposition = (disposition: BeaconMessageDisposition): string => {
  switch (disposition) {
    case "handled":
      return "matched an open request";
    case "stale":
      return "arrived after the request timed out";
    case "unknown-request":
      return "no open request has this id; dropped";
    case "invalid":
      return "rejected as invalid";
  }
};

// Beacon reports each incoming message twice: once at the boundary, and again
// with a disposition after handleResponse has routed it.
const messageEntry = (record: BeaconMessageRecord): InspectorEntryInput => {
  const summary = summarizeBeaconMessage(record.message);
  const direction = record.direction === "outgoing" ? "to" : "from";
  const { disposition } = record;
  const subject = summary
    ? `${summary.type} ${direction} wallet via ${record.transport}`
    : `unrecognized ${record.direction} message via ${record.transport}`;
  return {
    ts: record.ts,
    lane: "message",
    kind: disposition ? `${record.direction}:${disposition}` : record.direction,
    ...(summary ? { requestId: summary.id } : {}),
    summary: disposition
      ? `${subject}: ${describeDisposition(disposition)}`
      : summary
        ? `${subject} (${summary.protocol})`
        : subject,
    payload: toJsonSafe(record),
  };
};

/**
 * Subscribes to every `BeaconEvent` and to plaintext protocol messages, and
 * appends a JSON-safe entry to the log for each. Resolves to a detach function
 * that removes every subscription it made.
 */
export const attachBeaconCollector = async (
  source: BeaconInspectorSource,
  { log, now = Date.now, onPendingRequests }: BeaconCollectorOptions,
): Promise<() => void> => {
  const refreshPending = () => {
    onPendingRequests?.(source.getPendingRequests());
  };

  const unsubscribes = await Promise.all(
    Object.values(BeaconEvent).map((event) =>
      source.subscribeToEvent(event, (data: unknown) => {
        log.append(eventEntry(event, data, now));
        refreshPending();
      }),
    ),
  );
  unsubscribes.push(
    source.subscribeToMessages((record) => {
      log.append(messageEntry(record));
      refreshPending();
    }),
  );

  let detached = false;
  return () => {
    if (detached) return;
    detached = true;
    for (const unsubscribe of unsubscribes) unsubscribe();
  };
};
