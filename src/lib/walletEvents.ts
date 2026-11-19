import type { WalletProvider } from "@/types/wallet";
import {
  BeaconEvent,
  type BeaconWallet,
  type InvalidAccountDeactivatedEvent,
  type LateResponseInfo,
} from "@taquito/beacon-wallet";
import {
  BeaconErrorType,
  BeaconMessageType,
  getBeaconErrorCopy,
  isBeaconError,
  isRequestErrorResponse,
  isTezosRpcError,
  resolveBeaconLang,
  type RequestErrorResponse,
} from "@taquito/beacon-wallet/types";
import { toast } from "vue-sonner";
import type { Ref } from "vue";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const extractRpcErrorDetail = (errorData: unknown): string | undefined => {
  if (!Array.isArray(errorData)) {
    return undefined;
  }

  for (const item of errorData) {
    if (!isTezosRpcError(item)) {
      continue;
    }
    if (isRecord(item.with)) {
      if (typeof item.with.string === "string" && item.with.string.length > 0) {
        return item.with.string;
      }
      if (typeof item.with.int === "number") {
        return String(item.with.int);
      }
    }
    if (typeof item.id === "string" && item.id.length > 0) {
      return item.id;
    }
  }

  return undefined;
};

const formatBeaconErrorType = (
  errorType: BeaconErrorType,
  errorData?: unknown,
  errorOrigin?: RequestErrorResponse["errorOrigin"],
): string => {
  const copy = getBeaconErrorCopy(errorType);

  if (
    errorType === BeaconErrorType.ABORTED_ERROR &&
    errorOrigin === "local" &&
    resolveBeaconLang() === "en"
  ) {
    return "The wallet request was cancelled.";
  }

  if (errorType === BeaconErrorType.TRANSACTION_INVALID_ERROR) {
    const detail = extractRpcErrorDetail(errorData);
    if (detail) {
      return `${copy.description.replace(/\.$/, "")} (${detail}).`;
    }
  }

  return copy.description;
};

/**
 * Formats Beacon SDK errors, `RequestErrorResponse` payloads, and standard
 * exceptions into readable user-facing strings localized to the active Beacon
 * i18n locale.
 */
export const formatBeaconError = (error: unknown): string => {
  if (typeof error === "string") {
    return error;
  }

  if (isBeaconError(error)) {
    const errorData = Array.isArray(error.errorData)
      ? error.errorData
      : undefined;
    return formatBeaconErrorType(error.errorType, errorData, error.errorOrigin);
  }

  if (isRequestErrorResponse(error)) {
    return formatBeaconErrorType(
      error.errorType,
      error.errorData,
      error.errorOrigin,
    );
  }

  if (error instanceof Error) {
    // Strip leading "[ERROR_TYPE]:" prefix from BeaconError-like Error messages
    const stripped = error.message.replace(/^\[[A-Z0-9_]+\]:\s*/, "");
    return stripped || error.message;
  }

  if (isRecord(error)) {
    if (typeof error.description === "string") {
      return error.description;
    }
    if (typeof error.message === "string") {
      return error.message;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return "An unexpected error occurred.";
    }
  }

  return String(error);
};

/**
 * Returns a wallet-aware confirmation prompt for the "wait-for-user" diagram
 * step, or `null` when the active provider signs in-memory without user
 * interaction in an external wallet.
 *
 * See https://github.com/ecadlabs/beacon-sdk-taquito-patches/issues/136 for the
 * upstream feature request to expose a typed `WalletInfo` API on `DAppClient`.
 */
export const getWalletConfirmationMessage = (
  provider?: WalletProvider,
  walletName?: string,
): string | null => {
  if (provider === "programmatic" || provider === "web3auth") {
    return null;
  }

  const target = walletName?.trim() || "your wallet";
  return `Check ${target} to confirm the operation`;
};

const describeInvalidAccountReason = (
  event?: InvalidAccountDeactivatedEvent,
): string => {
  switch (event?.reason) {
    case "invalid_active_account_storage":
      return "Saved wallet session data could not be read. Please reconnect your wallet.";
    case "storage_validation_failed":
      return "Your saved wallet session is no longer valid. Please reconnect your wallet.";
    case "missing_active_account":
    default:
      return "Your wallet session has expired. Please reconnect your wallet.";
  }
};

const handleLateResponse = (info: LateResponseInfo): void => {
  const walletName = info.walletInfo?.name || "Your wallet";

  if (info.kind === "success") {
    if (info.transactionHash) {
      const actionLabel =
        info.requestType === BeaconMessageType.BroadcastRequest
          ? "broadcast the transaction"
          : "submitted the operation";
      toast.warning(
        `${walletName} ${actionLabel} after the request timed out`,
        {
          description: `Operation hash: ${info.transactionHash}`,
        },
      );
      return;
    }

    if (
      "signature" in info.output &&
      typeof info.output.signature === "string"
    ) {
      toast.info(
        `${walletName} signed the payload after the request timed out`,
        {
          description: `Signature: ${info.output.signature}`,
        },
      );
      return;
    }

    toast.info(`${walletName} responded after the request timed out`);
    return;
  }

  toast.warning(`${walletName} returned an error after the request timed out`, {
    description: formatBeaconError(info.error),
  });
};

/** The parts of the wallet store the Beacon event handlers read and drive. */
export interface BeaconWalletEventsStore {
  address: Ref<string | undefined>;
  isDisconnecting: Ref<boolean>;
  hasWallet: () => boolean;
  disconnectWallet: (fromWallet?: boolean) => Promise<void>;
  /** Re-reads wallet name and icon after the active account changes. */
  refreshWalletDisplay: () => Promise<void>;
}

/**
 * Subscribes the wallet store to ACTIVE_ACCOUNT_SET, LATE_RESPONSE_RECEIVED,
 * and INVALID_ACCOUNT_DEACTIVATED. Resolves to a cleanup function that removes
 * all three, so re-initializing the wallet (which reuses the singleton
 * DAppClient) does not stack handlers.
 */
const attachBeaconWalletEvents = async (
  wallet: Pick<BeaconWallet, "subscribeToEvent">,
  store: BeaconWalletEventsStore,
): Promise<() => void> => {
  const unsubscribes = await Promise.all([
    wallet.subscribeToEvent(BeaconEvent.ACTIVE_ACCOUNT_SET, async (account) => {
      if (account) {
        store.address.value = account.address;
        await store.refreshWalletDisplay();
      } else if (store.address.value && !store.isDisconnecting.value) {
        await store.disconnectWallet(true);
      }
    }),
    wallet.subscribeToEvent(BeaconEvent.LATE_RESPONSE_RECEIVED, (info) => {
      handleLateResponse(info);
    }),
    wallet.subscribeToEvent(
      BeaconEvent.INVALID_ACCOUNT_DEACTIVATED,
      async (event) => {
        if (
          (store.address.value || store.hasWallet()) &&
          !store.isDisconnecting.value
        ) {
          await store.disconnectWallet(false);
        }
        if (event?.reason && event.reason !== "missing_active_account") {
          toast.warning("Wallet session deactivated", {
            description: describeInvalidAccountReason(event),
          });
        }
      },
    ),
  ]);

  let released = false;
  return () => {
    if (released) return;
    released = true;
    for (const unsubscribe of unsubscribes) unsubscribe();
  };
};

export { attachBeaconWalletEvents };
