import { BeaconEvent, type BeaconWallet } from "@taquito/beacon-wallet";
import { BeaconMessageType, SigningType } from "@taquito/beacon-wallet/types";
import type { TezosToolkit } from "@taquito/taquito";

import {
  buildBytesParameter,
  buildSignPayload,
  exceedsOperationLimit,
} from "./payloads";
import { createRunTracker, type RunTiming } from "./run-tracker";

export type RequestKind = "sign" | "operation";

export interface RunResult {
  kind: RequestKind;
  sizeBytes: number;
  transport: string | null;
  walletName: string | null;
  walletBuild: string;
  timing: RunTiming | null;
  outcome: "approved" | "failed";
  detail: string;
  /**
   * Operation over the 32 KiB injection limit; failure after approval is
   * expected.
   */
  overInjectionLimit: boolean;
  startedAt: number;
}

const REQUEST_TYPE: Record<RequestKind, BeaconMessageType> = {
  sign: BeaconMessageType.SignPayloadRequest,
  operation: BeaconMessageType.OperationRequest,
};

const describeError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const errorType = Reflect.get(error, "errorType");
    if (typeof errorType === "string") return errorType;
  }
  return String(error);
};

export const runLargePayloadRequest = async ({
  wallet,
  tezos,
  kind,
  sizeBytes,
  sourceAddress,
  sinkAddress,
  walletBuild,
}: {
  wallet: BeaconWallet;
  tezos: TezosToolkit;
  kind: RequestKind;
  sizeBytes: number;
  sourceAddress: string;
  sinkAddress: string | undefined;
  walletBuild: string;
}): Promise<RunResult> => {
  const tracker = createRunTracker(REQUEST_TYPE[kind]);
  let transport: string | null = null;
  let walletName: string | null = null;

  const sentEvent =
    kind === "sign"
      ? BeaconEvent.SIGN_REQUEST_SENT
      : BeaconEvent.OPERATION_REQUEST_SENT;

  const unsubscribes = await Promise.all([
    wallet.subscribeToEvent(sentEvent, (info) => {
      // A follower tab forwards to the leader tab; only transport dispatch
      // carries a dispatch start time.
      if (info.dispatchStage !== "transport") return;
      tracker.sent(
        {
          requestId: info.requestId,
          requestType: info.requestType,
          sentAt: info.sentAt,
        },
        Date.now(),
      );
      transport = info.transport;
      walletName = info.walletInfo.name;
    }),
    wallet.subscribeToEvent(BeaconEvent.ACKNOWLEDGE_RECEIVED, (info) => {
      tracker.ack(
        info.correlated
          ? {
              correlated: true,
              requestId: info.requestId,
              receivedAt: info.receivedAt,
            }
          : { correlated: false, receivedAt: info.receivedAt },
      );
    }),
  ]);

  const startedAt = Date.now();
  let outcome: RunResult["outcome"];
  let detail: string;
  try {
    if (kind === "sign") {
      const response = await wallet.client.requestSignPayload({
        signingType: SigningType.MICHELINE,
        payload: buildSignPayload(sizeBytes),
        sourceAddress,
      });
      detail = response.signature;
    } else {
      if (!sinkAddress) {
        throw new Error("large-payload-sink is not deployed on this network");
      }
      const operation = await tezos.wallet
        .transfer({
          to: sinkAddress,
          amount: 0,
          parameter: {
            entrypoint: "default",
            value: buildBytesParameter(sizeBytes),
          },
        })
        .send();
      detail = operation.opHash;
    }
    outcome = "approved";
  } catch (error) {
    outcome = "failed";
    detail = describeError(error);
  }
  const respondedAt = Date.now();
  unsubscribes.forEach((unsubscribe) => unsubscribe());

  return {
    kind,
    sizeBytes,
    transport,
    walletName,
    walletBuild,
    timing: tracker.finish(respondedAt),
    outcome,
    detail,
    overInjectionLimit:
      kind === "operation" && exceedsOperationLimit(sizeBytes),
    startedAt,
  };
};

const formatMs = (ms: number | null) => (ms === null ? "" : String(ms));

const ackColumn = (timing: RunTiming | null) => {
  if (!timing) return "no SENT event";
  if (timing.ackSource === "wallet-ack") return formatMs(timing.toAckMs);
  return timing.ackSource;
};

/** Markdown table for pasting into an issue. */
export const resultsToMarkdown = (results: readonly RunResult[]): string => {
  const header =
    "| Kind | Size (KiB) | Transport | Wallet | Build | Dispatch ms | To ack ms | To response ms (incl. approval) | Outcome |\n" +
    "| --- | ---: | --- | --- | --- | ---: | ---: | ---: | --- |";
  const rows = results.map((r) =>
    [
      r.kind,
      String(r.sizeBytes / 1024),
      r.transport ?? "",
      r.walletName ?? "",
      r.walletBuild,
      formatMs(r.timing?.dispatchMs ?? null),
      ackColumn(r.timing),
      formatMs(r.timing?.toResponseMs ?? null),
      r.outcome === "approved"
        ? "approved"
        : `failed: ${r.detail.replace(/\|/g, "\\|")}`,
    ].join(" | "),
  );
  return [header, ...rows.map((row) => `| ${row} |`)].join("\n");
};
