/**
 * Shared types for the Beacon inspector drawer.
 *
 * Everything stored in the inspector log is a JSON-safe snapshot taken at
 * capture time. Live SDK objects (transports, promises, callbacks) never enter
 * the log, so Pinia reactivity never wraps them and exports are plain JSON.
 */

export type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

/**
 * - `event`: a `BeaconEvent` emitted by `DAppClient`
 * - `message`: a plaintext protocol message from `subscribeToMessages()`
 * - `connection`: transport status and health changes
 * - `log`: Beacon's own logger output and diagnostics, via `setLogger`
 */
export type InspectorLane = "event" | "message" | "connection" | "log";

export interface InspectorEntry {
  /** Monotonic sequence number, unique within one log. */
  readonly seq: number;
  /** Epoch milliseconds. Taken from the SDK payload when it carries one. */
  readonly ts: number;
  readonly lane: InspectorLane;
  /** `BeaconEvent` name for events, `outgoing`/`incoming` for messages. */
  readonly kind: string;
  /** Beacon request id, when the source data carries one. */
  readonly requestId?: string;
  /** One-line human-readable description for the timeline row. */
  readonly summary: string;
  /** JSON-safe snapshot of the source payload for the detail view. */
  readonly payload: JsonValue;
}

export type InspectorEntryInput = Omit<InspectorEntry, "seq">;
