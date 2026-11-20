/** Octez `max_operation_data_length`, enforced at injection, not at simulation. */
export const OPERATION_DATA_LIMIT_BYTES = 32 * 1024;

/**
 * Generous allowance for everything in a signed transaction except the
 * parameter value: branch, signature, source, fees, counter, limits,
 * destination, entrypoint, and a possible reveal. The wallet builds the
 * operation, so the exact size near the limit is only approximate.
 */
const OPERATION_ENVELOPE_BYTES = 512;

export const PAYLOAD_SIZES_KIB: readonly number[] = [
  1, 8, 16, 32, 64, 128, 256,
];

/** 05 prefix + 01 string tag + 4-byte big-endian length. */
const PACKED_STRING_FRAMING_BYTES = 6;

const TEXT_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

const assertPositiveInteger = (
  value: number,
  minimum: number,
  name: string,
) => {
  if (!Number.isInteger(value) || value < minimum) {
    throw new RangeError(`${name} must be an integer of at least ${minimum}`);
  }
};

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

const fillText = (length: number): Uint8Array => {
  const out = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    out[i] = TEXT_ALPHABET.charCodeAt(i % TEXT_ALPHABET.length);
  }
  return out;
};

/**
 * Packed Micheline string (`05 01 <len> <ascii>`) whose total size is exactly
 * `totalBytes`. Kukai rejects sign requests that do not decode as Micheline.
 */
export const buildSignPayload = (totalBytes: number): string => {
  assertPositiveInteger(
    totalBytes,
    PACKED_STRING_FRAMING_BYTES + 1,
    "totalBytes",
  );
  const textLength = totalBytes - PACKED_STRING_FRAMING_BYTES;
  return (
    "0501" +
    textLength.toString(16).padStart(8, "0") +
    toHex(fillText(textLength))
  );
};

/** Micheline `bytes` literal of exactly `byteLength` bytes. */
export const buildBytesParameter = (byteLength: number): { bytes: string } => {
  assertPositiveInteger(byteLength, 1, "byteLength");
  return { bytes: toHex(fillText(byteLength)) };
};

export const exceedsOperationLimit = (parameterBytes: number): boolean =>
  parameterBytes + OPERATION_ENVELOPE_BYTES > OPERATION_DATA_LIMIT_BYTES;

export interface AckObservation {
  /** True only when the wallet acknowledged this request after decoding it. */
  correlated: boolean;
  receivedAt: number;
}

export type AckSource = "wallet-ack" | "relay-status-only" | "no-ack";

export interface TimingSummary {
  /** DApp encode + transport + wallet decode. Null when no wallet ack exists. */
  toAckMs: number | null;
  ackSource: AckSource;
  /** Includes the time the user spent approving. */
  toResponseMs: number | null;
}

export const summarizeTiming = ({
  sentAt,
  ack,
  respondedAt,
}: {
  sentAt: number;
  ack?: AckObservation;
  respondedAt?: number;
}): TimingSummary => {
  const ackSource: AckSource = !ack
    ? "no-ack"
    : ack.correlated
      ? "wallet-ack"
      : "relay-status-only";
  return {
    toAckMs: ack?.correlated ? ack.receivedAt - sentAt : null,
    ackSource,
    toResponseMs: respondedAt === undefined ? null : respondedAt - sentAt,
  };
};
