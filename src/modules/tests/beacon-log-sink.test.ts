import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, test } from "node:test";
import {
  type BeaconLogForward,
  createBeaconLogSink,
} from "@/lib/inspector/beaconLogSink";
import { createInspectorLog } from "@/lib/inspector/inspectorLog";
import {
  InternalLogger,
  Logger,
  type LoggerDiagnostic,
  reportDiagnostic,
  setLogger,
} from "@taquito/beacon-wallet";

after(() => setLogger(new InternalLogger()));

type ForwardedCall = { level: string; params: unknown[] };

// Records what the sink passes on, standing in for Beacon's console logger.
const recordingForward = () => {
  const calls: ForwardedCall[] = [];
  const forward: BeaconLogForward = {
    debug: (...params) => calls.push({ level: "debug", params }),
    log: (...params) => calls.push({ level: "log", params }),
    warn: (...params) => calls.push({ level: "warn", params }),
    error: (...params) => calls.push({ level: "error", params }),
    diagnostic: (diagnostic) =>
      void calls.push({ level: "diagnostic", params: [diagnostic] }),
    time: (...params) => calls.push({ level: "time", params }),
    timeLog: (...params) => calls.push({ level: "timeLog", params }),
  };
  return { calls, forward };
};

const install = ({ debug = false } = {}) => {
  const log = createInspectorLog({ capacity: 100 });
  const { calls, forward } = recordingForward();
  const errors: unknown[] = [];
  setLogger(
    createBeaconLogSink({
      log,
      now: () => 1_000,
      isDebugEnabled: () => debug,
      forward,
      reportError: (_message, error) => errors.push(error),
    }),
  );
  return { log, calls, errors };
};

test("log sink records Beacon warnings and errors in the log lane", () => {
  const { log } = install();

  new Logger("DAppClient").warn(
    "handleResponse",
    "received response for unknown or closed request",
    { id: "req-1" },
  );
  new Logger("MatrixHttpClient").error("send", "502", "Bad Gateway");

  const [warning, failure] = log.entries();
  assert.equal(warning.lane, "log");
  assert.equal(warning.kind, "warn");
  assert.equal(warning.ts, 1_000);
  assert.equal(
    warning.summary,
    "[DAppClient](handleResponse) received response for unknown or closed request",
  );
  assert.deepEqual(warning.payload, {
    service: "DAppClient",
    method: "handleResponse",
    args: ["received response for unknown or closed request", { id: "req-1" }],
  });

  assert.equal(failure.kind, "error");
  assert.equal(failure.summary, "[MatrixHttpClient](send) 502");
});

test("log sink records debug and log lines only while Beacon debug mode is on", () => {
  const quiet = install({ debug: false });
  new Logger("P2PCommunicationClient").debug("sync", "polling");
  new Logger("P2PCommunicationClient").log("start", "login successful");
  assert.equal(quiet.log.entries().length, 0);

  const verbose = install({ debug: true });
  new Logger("P2PCommunicationClient").debug("sync", "polling");
  new Logger("P2PCommunicationClient").log("start", "login successful");
  assert.deepEqual(
    verbose.log.entries().map((entry) => entry.kind),
    ["debug", "log"],
  );
});

test("log sink always records diagnostics, even with debug mode off", () => {
  const { log } = install({ debug: false });
  const diagnostic: LoggerDiagnostic = {
    level: "warn",
    service: "DAppClient",
    method: "getDAppClientInstance",
    args: ["called with a different config", { name: "Tezlink" }],
  };

  reportDiagnostic(diagnostic);

  const [entry] = log.entries();
  assert.equal(entry.lane, "log");
  assert.equal(entry.kind, "warn");
  assert.equal(
    entry.summary,
    "[DAppClient](getDAppClientInstance) called with a different config",
  );
  assert.deepEqual(entry.payload, {
    service: "DAppClient",
    method: "getDAppClientInstance",
    args: ["called with a different config", { name: "Tezlink" }],
    diagnostic: true,
  });
});

test("log sink passes every call on unchanged so Beacon's console output stays", () => {
  const { calls } = install({ debug: false });
  const diagnostic: LoggerDiagnostic = {
    level: "error",
    service: "BeaconClient",
    method: "init",
    args: ["boom"],
  };

  new Logger("DAppClient").debug("init", "quiet line");
  new Logger("DAppClient").warn("init", "loud line", 42);
  new Logger("DAppClient").time(true, "label");
  new Logger("DAppClient").timeLog("init", "tick");
  reportDiagnostic(diagnostic);

  // Beacon's Logger packs the arguments into one array before calling the
  // installed logger, so that is the shape the console logger expects back.
  assert.deepEqual(calls, [
    { level: "debug", params: ["DAppClient", "init", ["quiet line"]] },
    { level: "warn", params: ["DAppClient", "init", ["loud line", 42]] },
    { level: "time", params: [true, "label"] },
    { level: "timeLog", params: ["init", ["tick"]] },
    { level: "diagnostic", params: [diagnostic] },
  ]);
});

test("log sink never throws into the SDK when recording a line fails", () => {
  const { log, calls, errors } = install();
  const hostile = {
    get detail(): string {
      throw new Error("getter exploded");
    },
  };

  assert.doesNotThrow(() =>
    new Logger("DAppClient").warn("handleResponse", "hostile", hostile),
  );
  assert.equal(log.entries().length, 0);
  assert.equal(calls.length, 1, "the console logger still received the call");
  assert.equal(errors.length, 1, "the failure is reported, not swallowed");
});

test("log sink redacts secret keys in summaries and payloads", () => {
  const { log } = install();
  const secret = "edsk3QoqBuvdamxouPhin7swCvkQNgq4jP5KZPbwWNnwdZpSpJiEbq";

  new Logger("Signer").error("sign", `bad key ${secret}`, { key: secret });

  const [entry] = log.entries();
  assert.doesNotMatch(entry.summary, /edsk/);
  assert.doesNotMatch(JSON.stringify(entry.payload), /edsk/);
});

test("the inspector store installs the log sink, and wallets are created after it", async () => {
  const [inspectorStoreTs, createWalletStoreTs] = await Promise.all([
    readFile("src/stores/inspectorStore.ts", "utf8"),
    readFile("src/stores/createWalletStore.ts", "utf8"),
  ]);

  assert.match(inspectorStoreTs, /setLogger\(\s*createBeaconLogSink\(/);

  // getDAppClientInstance reports its config-mismatch diagnostic during
  // `new BeaconWallet`, so the sink has to be in place before that.
  const inspectorCreated = createWalletStoreTs.indexOf(
    "useBeaconInspectorStore()",
  );
  const walletCreated = createWalletStoreTs.indexOf("new BeaconWallet(");
  assert.ok(inspectorCreated >= 0, "the wallet store uses the inspector store");
  assert.ok(
    inspectorCreated < walletCreated,
    "the inspector store, and so the log sink, must exist before new BeaconWallet",
  );
});
