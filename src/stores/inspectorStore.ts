import { createBeaconLogSink } from "@/lib/inspector/beaconLogSink";
import { createInspectorLog } from "@/lib/inspector/inspectorLog";
import type { InspectorEntry } from "@/lib/inspector/types";
import {
  getDebugEnabled,
  type PendingRequestInfo,
  setDebugEnabled,
  setLogger,
} from "@taquito/beacon-wallet";
import { defineStore } from "pinia";
import { markRaw, ref, shallowRef, watch } from "vue";

const LOG_CAPACITY = 2000;
const OPEN_STORAGE_KEY = "beacon-inspector-open";
const DEBUG_STORAGE_KEY = "beacon-inspector-debug";

const readOpenPreference = (): boolean => {
  try {
    return localStorage.getItem(OPEN_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

const writeOpenPreference = (open: boolean): void => {
  try {
    localStorage.setItem(OPEN_STORAGE_KEY, String(open));
  } catch {
    // Storage is a per-viewer convenience; the drawer works without it.
  }
};

/** The saved debug toggle, or undefined if it was never set or can't be read. */
const readDebugPreference = (): boolean | undefined => {
  try {
    const saved = localStorage.getItem(DEBUG_STORAGE_KEY);
    return saved === null ? undefined : saved === "true";
  } catch {
    return undefined;
  }
};

const writeDebugPreference = (enabled: boolean): void => {
  try {
    localStorage.setItem(DEBUG_STORAGE_KEY, String(enabled));
  } catch {
    // Storage is a per-viewer convenience; the toggle works without it.
  }
};

/**
 * Session-wide Beacon inspector state. The log outlives wallet resets so a
 * failed or cancelled connection can still be inspected afterwards.
 */
export const useBeaconInspectorStore = defineStore("beaconInspector", () => {
  // markRaw keeps Pinia from proxying the log; entries are exposed as
  // immutable snapshots through a shallowRef instead.
  const log = markRaw(createInspectorLog({ capacity: LOG_CAPACITY }));
  // setLogger replaces Beacon's logger for the whole page, so it is installed
  // here, once, rather than per wallet. The sink passes every call on to
  // Beacon's console logger.
  setLogger(createBeaconLogSink({ log }));
  const entries = shallowRef<readonly InspectorEntry[]>(log.entries());
  const evictedCount = ref(log.evictedCount());
  log.subscribe(() => {
    entries.value = log.entries();
    evictedCount.value = log.evictedCount();
  });

  const pendingRequests = shallowRef<readonly PendingRequestInfo[]>([]);
  const setPendingRequests = (pending: readonly PendingRequestInfo[]) => {
    pendingRequests.value = pending;
  };

  // Beacon debug mode is page-wide: it also turns on Beacon's console output.
  // A toggle saved in this browser wins over the SDK's load-time flag
  // (`window.beaconSdkDebugEnabled`). Lines logged before this store exists
  // are not recorded.
  const savedDebug = readDebugPreference();
  if (savedDebug !== undefined) setDebugEnabled(savedDebug);
  const debugLogs = ref(getDebugEnabled());
  const setDebugLogs = (enabled: boolean) => {
    setDebugEnabled(enabled);
    debugLogs.value = enabled;
    writeDebugPreference(enabled);
  };

  const isOpen = ref(readOpenPreference());
  watch(isOpen, writeOpenPreference);

  return {
    log,
    entries,
    evictedCount,
    pendingRequests,
    setPendingRequests,
    debugLogs,
    setDebugLogs,
    isOpen,
    open: () => {
      isOpen.value = true;
    },
    close: () => {
      isOpen.value = false;
    },
    toggle: () => {
      isOpen.value = !isOpen.value;
    },
    clear: () => log.clear(),
  };
});
