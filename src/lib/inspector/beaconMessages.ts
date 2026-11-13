/**
 * `BeaconMessageRecord.message` is `unknown`: incoming records are observed
 * before validation, so they can be malformed. These guards recover the
 * correlation fields without trusting the shape.
 */

export interface BeaconMessageSummary {
  /** Beacon message id; equal for a request and its response. */
  id: string;
  /** Beacon message type, e.g. `operation_request`. */
  type: string;
  version: string;
  /** `v2` for flat messages, `v3` for `BeaconMessageWrapper` envelopes. */
  protocol: "v2" | "v3";
}

const isRecord = (value: unknown): value is object =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readString = (value: object, key: string): string | undefined => {
  if (!(key in value)) return undefined;
  const field: unknown = Reflect.get(value, key);
  return typeof field === "string" ? field : undefined;
};

export const summarizeBeaconMessage = (
  message: unknown,
): BeaconMessageSummary | undefined => {
  if (!isRecord(message)) return undefined;

  const id = readString(message, "id");
  const version = readString(message, "version");
  if (id === undefined || version === undefined) return undefined;

  const inner: unknown =
    "message" in message ? Reflect.get(message, "message") : undefined;
  if (isRecord(inner)) {
    const type = readString(inner, "type");
    return type === undefined
      ? undefined
      : { id, type, version, protocol: "v3" };
  }

  const type = readString(message, "type");
  return type === undefined ? undefined : { id, type, version, protocol: "v2" };
};
