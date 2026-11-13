import assert from "node:assert/strict";
import { after, test } from "node:test";
import { useBeaconInspectorStore } from "@/stores/inspectorStore";
import {
  getDebugEnabled,
  InternalLogger,
  Logger,
  setDebugEnabled,
  setLogger,
} from "@taquito/beacon-wallet";
import { createPinia, setActivePinia } from "pinia";

after(() => {
  setDebugEnabled(false);
  setLogger(new InternalLogger());
});

const freshStore = () => {
  setActivePinia(createPinia());
  return useBeaconInspectorStore();
};

test("inspector store starts from Beacon's own debug flag", () => {
  setDebugEnabled(true);
  assert.equal(freshStore().debugLogs, true);

  setDebugEnabled(false);
  assert.equal(freshStore().debugLogs, false);
});

test("the debug toggle switches Beacon debug mode on and off", () => {
  setDebugEnabled(false);
  const inspector = freshStore();

  inspector.setDebugLogs(true);
  assert.equal(inspector.debugLogs, true);
  assert.equal(getDebugEnabled(), true);

  inspector.setDebugLogs(false);
  assert.equal(inspector.debugLogs, false);
  assert.equal(getDebugEnabled(), false);
});

test("with the toggle on, Beacon debug lines reach the SDK logs lane", () => {
  setDebugEnabled(false);
  const inspector = freshStore();

  new Logger("P2PCommunicationClient").debug("sync", "before toggle");
  inspector.setDebugLogs(true);
  new Logger("P2PCommunicationClient").debug("sync", "after toggle");

  const summaries = inspector.log
    .entries()
    .filter((entry) => entry.lane === "log")
    .map((entry) => entry.summary);
  assert.deepEqual(summaries, ["[P2PCommunicationClient](sync) after toggle"]);
});
