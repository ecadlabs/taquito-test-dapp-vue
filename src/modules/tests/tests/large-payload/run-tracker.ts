import {
  summarizeTiming,
  type AckObservation,
  type TimingSummary,
} from "./payloads";

/** Fields this page reads from Beacon's `*_REQUEST_SENT` event payload. */
export interface SentEvent {
  requestId: string;
  requestType: string;
  /** Start of dispatch. The SENT event itself fires after dispatch completes. */
  sentAt: number;
}

export type AckEvent =
  | { correlated: true; requestId: string; receivedAt: number }
  | { correlated: false; receivedAt: number };

export interface RunTiming extends TimingSummary {
  requestId: string;
  /**
   * DApp-side serialize plus the awaited `transport.send`, which on Matrix
   * includes encrypting and uploading to the relay.
   */
  dispatchMs: number;
}

/**
 * Collects Beacon events for one request. Acks are buffered by request ID
 * because a fast wallet can acknowledge before the SENT handler runs.
 */
export const createRunTracker = (requestType: string) => {
  let sent: { event: SentEvent; observedAt: number } | undefined;
  const correlatedAcks = new Map<string, number>();
  let uncorrelatedAckAt: number | undefined;

  return {
    sent(event: SentEvent, observedAt: number) {
      if (sent === undefined && event.requestType === requestType) {
        sent = { event, observedAt };
      }
    },

    ack(event: AckEvent) {
      if (event.correlated) {
        if (!correlatedAcks.has(event.requestId)) {
          correlatedAcks.set(event.requestId, event.receivedAt);
        }
      } else if (uncorrelatedAckAt === undefined) {
        uncorrelatedAckAt = event.receivedAt;
      }
    },

    finish(respondedAt?: number): RunTiming | null {
      if (sent === undefined) return null;
      const { requestId, sentAt } = sent.event;
      const correlatedAt = correlatedAcks.get(requestId);
      const ack: AckObservation | undefined =
        correlatedAt !== undefined
          ? { correlated: true, receivedAt: correlatedAt }
          : uncorrelatedAckAt !== undefined
            ? { correlated: false, receivedAt: uncorrelatedAckAt }
            : undefined;
      return {
        requestId,
        dispatchMs: sent.observedAt - sentAt,
        ...summarizeTiming({ sentAt, ack, respondedAt }),
      };
    },
  };
};
