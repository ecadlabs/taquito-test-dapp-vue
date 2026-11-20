import assert from "node:assert/strict";
import test from "node:test";

import { createRunTracker } from "./tests/large-payload/run-tracker";

const SIGN = "sign_payload_request";
const OPERATION = "operation_request";

test("pairs the correlated ack with the request this run sent", () => {
  const tracker = createRunTracker(SIGN);
  tracker.sent({ requestId: "a", requestType: SIGN, sentAt: 1_000 }, 1_040);
  tracker.ack({ correlated: true, requestId: "other", receivedAt: 1_100 });
  tracker.ack({ correlated: true, requestId: "a", receivedAt: 1_300 });

  assert.deepEqual(tracker.finish(5_000), {
    requestId: "a",
    dispatchMs: 40,
    toAckMs: 300,
    ackSource: "wallet-ack",
    toResponseMs: 4_000,
  });
});

test("keeps an ack that arrives before the SENT event is observed", () => {
  // PostMessage with a small payload can ack before the SENT handler runs.
  const tracker = createRunTracker(SIGN);
  tracker.ack({ correlated: true, requestId: "a", receivedAt: 1_020 });
  tracker.sent({ requestId: "a", requestType: SIGN, sentAt: 1_000 }, 1_030);

  assert.equal(tracker.finish(2_000)?.toAckMs, 20);
});

test("ignores SENT events for other request types", () => {
  const tracker = createRunTracker(OPERATION);
  tracker.sent({ requestId: "p", requestType: SIGN, sentAt: 1_000 }, 1_001);
  assert.equal(tracker.finish(2_000), null);

  tracker.sent(
    { requestId: "o", requestType: OPERATION, sentAt: 1_500 },
    1_510,
  );
  assert.equal(tracker.finish(2_000)?.requestId, "o");
});

test("first matching SENT wins so a retry cannot rewrite the timing", () => {
  const tracker = createRunTracker(SIGN);
  tracker.sent({ requestId: "a", requestType: SIGN, sentAt: 1_000 }, 1_010);
  tracker.sent({ requestId: "b", requestType: SIGN, sentAt: 3_000 }, 3_010);
  assert.equal(tracker.finish(4_000)?.requestId, "a");
});

test("an uncorrelated ack is reported as relay status, not wallet decode", () => {
  const tracker = createRunTracker(OPERATION);
  tracker.sent(
    { requestId: "o", requestType: OPERATION, sentAt: 1_000 },
    1_005,
  );
  tracker.ack({ correlated: false, receivedAt: 1_050 });

  assert.deepEqual(tracker.finish(9_000), {
    requestId: "o",
    dispatchMs: 5,
    toAckMs: null,
    ackSource: "relay-status-only",
    toResponseMs: 8_000,
  });
});

test("a correlated ack wins over an uncorrelated one", () => {
  const tracker = createRunTracker(SIGN);
  tracker.sent({ requestId: "a", requestType: SIGN, sentAt: 1_000 }, 1_005);
  tracker.ack({ correlated: false, receivedAt: 1_010 });
  tracker.ack({ correlated: true, requestId: "a", receivedAt: 1_200 });
  assert.equal(tracker.finish(2_000)?.ackSource, "wallet-ack");
});

test("finish without a response leaves the response time empty", () => {
  const tracker = createRunTracker(SIGN);
  tracker.sent({ requestId: "a", requestType: SIGN, sentAt: 1_000 }, 1_005);
  assert.equal(tracker.finish()?.toResponseMs, null);
  assert.equal(tracker.finish()?.ackSource, "no-ack");
});
