import assert from "node:assert/strict";
import test from "node:test";
import { unpackDataBytes } from "@taquito/michel-codec";

import {
  OPERATION_DATA_LIMIT_BYTES,
  PAYLOAD_SIZES_KIB,
  buildBytesParameter,
  buildSignPayload,
  exceedsOperationLimit,
  summarizeTiming,
} from "./tests/large-payload/payloads";

const KIB = 1024;

const isPrintableAscii = (value: string) =>
  [...value].every((char) => {
    const code = char.charCodeAt(0);
    return code >= 32 && code <= 126;
  });

test("sign payload is a packed Micheline string of exactly the requested size", () => {
  for (const kib of [1, 16, 128]) {
    const hex = buildSignPayload(kib * KIB);

    assert.equal(hex.length, kib * KIB * 2, `${kib} KiB payload length`);
    assert.match(hex, /^0501[0-9a-f]+$/);

    const decoded = unpackDataBytes({ bytes: hex });
    assert.ok("string" in decoded, "payload must decode to a Micheline string");
    // 05 prefix + 01 tag + 4-byte length header = 6 bytes of framing.
    assert.equal(decoded.string.length, kib * KIB - 6);
    assert.ok(
      isPrintableAscii(decoded.string),
      "Michelson strings must be printable ASCII",
    );
  }
});

test("sign payload rejects sizes too small to hold the packed framing", () => {
  assert.throws(() => buildSignPayload(5), RangeError);
  assert.throws(() => buildSignPayload(0), RangeError);
  assert.throws(() => buildSignPayload(1.5), RangeError);
});

test("bytes parameter carries exactly the requested number of bytes", () => {
  for (const size of [1, 16 * KIB, 128 * KIB]) {
    const parameter = buildBytesParameter(size);
    assert.match(parameter.bytes, /^[0-9a-f]*$/);
    assert.equal(parameter.bytes.length, size * 2);
  }
  assert.throws(() => buildBytesParameter(0), RangeError);
});

test("operation limit flags parameters that cannot fit in a 32 KiB operation", () => {
  assert.equal(OPERATION_DATA_LIMIT_BYTES, 32 * KIB);
  assert.equal(exceedsOperationLimit(16 * KIB), false);
  assert.equal(exceedsOperationLimit(31 * KIB), false);
  assert.equal(exceedsOperationLimit(32 * KIB), true);
  assert.equal(exceedsOperationLimit(128 * KIB), true);
});

test("offered sizes span below and above the operation limit", () => {
  assert.ok(PAYLOAD_SIZES_KIB.some((kib) => !exceedsOperationLimit(kib * KIB)));
  assert.ok(PAYLOAD_SIZES_KIB.some((kib) => exceedsOperationLimit(kib * KIB)));
  assert.ok(PAYLOAD_SIZES_KIB.includes(16));
  assert.ok(PAYLOAD_SIZES_KIB.includes(128));
});

test("timing reports a wallet ack only when the ack is correlated", () => {
  assert.deepEqual(
    summarizeTiming({
      sentAt: 1_000,
      ack: { correlated: true, receivedAt: 1_250 },
      respondedAt: 9_000,
    }),
    { toAckMs: 250, ackSource: "wallet-ack", toResponseMs: 8_000 },
  );

  // WalletConnect emits an uncorrelated ack from relay status, not after the
  // wallet decoded the request, so it says nothing about decode cost.
  assert.deepEqual(
    summarizeTiming({
      sentAt: 1_000,
      ack: { correlated: false, receivedAt: 1_100 },
      respondedAt: 5_000,
    }),
    { toAckMs: null, ackSource: "relay-status-only", toResponseMs: 4_000 },
  );

  assert.deepEqual(summarizeTiming({ sentAt: 1_000 }), {
    toAckMs: null,
    ackSource: "no-ack",
    toResponseMs: null,
  });
});
