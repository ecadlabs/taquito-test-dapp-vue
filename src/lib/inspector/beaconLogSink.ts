import {
  getDebugEnabled,
  InternalLogger,
  type LoggerDiagnostic,
  type LoggerInterface,
} from "@taquito/beacon-wallet";
import type { InspectorLog } from "./inspectorLog";
import { redactSecrets, toJsonSafe } from "./jsonSafe";

/** Where the sink passes every call on to, so Beacon's console output stays. */
export type BeaconLogForward = Pick<
  InternalLogger,
  "debug" | "log" | "warn" | "error" | "diagnostic" | "time" | "timeLog"
>;

export interface BeaconLogSinkOptions {
  log: InspectorLog;
  now?: () => number;
  /** Debug and log lines are recorded only while this returns true. */
  isDebugEnabled?: () => boolean;
  forward?: BeaconLogForward;
  /** Called when recording a line fails; the SDK call itself never throws. */
  reportError?: (message: string, error: unknown) => void;
}

interface BeaconLogLine {
  level: LoggerDiagnostic["level"] | "debug";
  service: unknown;
  method: unknown;
  args: readonly unknown[];
  diagnostic: boolean;
}

// LoggerInterface declares debug(method, ...args), but beacon-core's Logger
// wrapper calls the installed logger as (service, method, argsArray), and
// InternalLogger is written for that shape. See
// @ecadlabs/beacon-core/dist/esm/utils/Logger.js.
const unpack = (
  level: BeaconLogLine["level"],
  params: readonly unknown[],
): BeaconLogLine => {
  const [service, method, packed] = params;
  return {
    level,
    service,
    method,
    args: Array.isArray(packed) ? packed : params.slice(2),
    diagnostic: false,
  };
};

// Some SDK callers pass a non-string method, e.g. `logger.log(error)`.
// InternalLogger only interpolates both values into its group label, so
// String() leaves the console output unchanged.
const forwardParams = (
  params: readonly unknown[],
): [string, string, ...unknown[]] => [
  String(params[0]),
  String(params[1]),
  ...params.slice(2),
];

/**
 * A Beacon logger for `setLogger` that records lines in the inspector log and
 * passes every call on to Beacon's console logger. Warnings, errors and
 * diagnostics are always recorded. Debug and log lines are recorded only in
 * Beacon debug mode, because Matrix sync chatter would otherwise push real
 * events out of the log.
 */
export const createBeaconLogSink = ({
  log,
  now = Date.now,
  isDebugEnabled = getDebugEnabled,
  forward = new InternalLogger(),
  reportError = (message, error) => console.error(message, error),
}: BeaconLogSinkOptions): LoggerInterface => {
  // Runs inside SDK code paths, so a failure here must never reach them.
  const record = (line: BeaconLogLine) => {
    try {
      const first = line.args[0];
      log.append({
        ts: now(),
        lane: "log",
        kind: line.level,
        summary: redactSecrets(
          `[${String(line.service)}](${String(line.method)})${typeof first === "string" ? ` ${first}` : ""}`,
        ),
        payload: toJsonSafe({
          service: line.service,
          method: line.method,
          args: line.args,
          ...(line.diagnostic ? { diagnostic: true } : {}),
        }),
      });
    } catch (error) {
      reportError(
        "[Beacon inspector] could not record a Beacon log line",
        error,
      );
    }
  };

  return {
    debug: (...params: unknown[]) => {
      if (isDebugEnabled()) record(unpack("debug", params));
      forward.debug(...forwardParams(params));
    },
    log: (...params: unknown[]) => {
      if (isDebugEnabled()) record(unpack("log", params));
      forward.log(...forwardParams(params));
    },
    warn: (...params: unknown[]) => {
      record(unpack("warn", params));
      forward.warn(...forwardParams(params));
    },
    error: (...params: unknown[]) => {
      record(unpack("error", params));
      forward.error(...forwardParams(params));
    },
    diagnostic: (diagnostic: LoggerDiagnostic) => {
      record({ ...diagnostic, diagnostic: true });
      return forward.diagnostic(diagnostic);
    },
    time: (start: boolean, label?: string) => forward.time(start, label),
    timeLog: (method: string, ...args: unknown[]) =>
      forward.timeLog(method, ...args),
  };
};
