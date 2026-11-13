import type { InspectorEntry, InspectorEntryInput } from "./types";

export interface InspectorLog {
  /** Appends an entry, evicting the oldest one when the log is at capacity. */
  append(input: InspectorEntryInput): InspectorEntry;
  /** Entries in insertion order, oldest first. Returns a new array each call. */
  entries(): readonly InspectorEntry[];
  /** Entries carrying `requestId`, in insertion order. */
  forRequest(requestId: string): readonly InspectorEntry[];
  /** Number of entries evicted since creation or the last `clear()`. */
  evictedCount(): number;
  clear(): void;
  /** Called after every append and clear. Returns an idempotent unsubscribe. */
  subscribe(listener: () => void): () => void;
}

export interface InspectorLogOptions {
  capacity: number;
}

export const createInspectorLog = ({
  capacity,
}: InspectorLogOptions): InspectorLog => {
  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new RangeError(`Inspector log capacity must be a positive integer`);
  }

  let buffer: InspectorEntry[] = [];
  let evicted = 0;
  // Never reset, so seq stays unique across clears.
  let nextSeq = 1;
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of [...listeners]) listener();
  };

  return {
    append(input) {
      const entry: InspectorEntry = { seq: nextSeq, ...input };
      nextSeq += 1;
      buffer.push(entry);
      if (buffer.length > capacity) {
        evicted += buffer.length - capacity;
        buffer = buffer.slice(buffer.length - capacity);
      }
      notify();
      return entry;
    },
    entries: () => [...buffer],
    forRequest: (requestId) =>
      buffer.filter((entry) => entry.requestId === requestId),
    evictedCount: () => evicted,
    clear() {
      buffer = [];
      evicted = 0;
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};
