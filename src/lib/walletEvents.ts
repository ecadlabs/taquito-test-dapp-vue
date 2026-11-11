import type { WalletStoreState } from "@/stores/createWalletStore";
import type { WalletProvider } from "@/types/wallet";
import {
  BeaconEvent,
  type BeaconWallet,
  type InvalidAccountDeactivatedEvent,
  type LateResponseInfo,
  type RequestErrorResponse,
} from "@taquito/beacon-wallet";
import {
  BeaconErrorType,
  BeaconMessageType,
} from "@taquito/beacon-wallet/types";
import { toast } from "vue-sonner";

interface RpcErrorItem {
  kind?: string;
  id?: string;
  with?: {
    string?: string;
    int?: number;
  };
}

const isBeaconErrorObject = (
  value: unknown,
): value is Partial<RequestErrorResponse> & { errorType: BeaconErrorType } =>
  typeof value === "object" &&
  value !== null &&
  "errorType" in value &&
  typeof (value as { errorType: unknown }).errorType === "string";

const extractRpcErrorDetail = (errorData: unknown): string | undefined => {
  if (!Array.isArray(errorData)) {
    return undefined;
  }

  for (const item of errorData as RpcErrorItem[]) {
    if (item && typeof item === "object") {
      if (item.with?.string) {
        return item.with.string;
      }
      if (typeof item.with?.int === "number") {
        return String(item.with.int);
      }
      if (typeof item.id === "string" && item.id.length > 0) {
        return item.id;
      }
    }
  }

  return undefined;
};

/**
 * Formats Beacon SDK errors, `RequestErrorResponse` payloads, and standard
 * exceptions into readable user-facing strings.
 */
export const formatBeaconError = (error: unknown): string => {
  if (typeof error === "string") {
    return error;
  }

  if (isBeaconErrorObject(error)) {
    const isLocal = error.errorOrigin === "local";
    switch (error.errorType) {
      case BeaconErrorType.ABORTED_ERROR:
        return isLocal
          ? "The wallet request was cancelled."
          : "The request was aborted in the wallet.";
      case BeaconErrorType.PEER_UNREACHABLE:
        return "The wallet did not respond in time. Check the wallet and your recent account activity before trying again.";
      case BeaconErrorType.TRANSACTION_INVALID_ERROR: {
        const detail = extractRpcErrorDetail(error.errorData);
        return detail
          ? `The transaction is invalid and the node rejected it (${detail}).`
          : "The transaction is invalid and the node did not accept it.";
      }
      case BeaconErrorType.SIGNATURE_TYPE_NOT_SUPPORTED:
        return "The wallet is not able to sign payloads of this type.";
      case BeaconErrorType.BROADCAST_ERROR:
        return "The transaction could not be broadcast to the network. Please try again.";
      case BeaconErrorType.NETWORK_NOT_SUPPORTED:
        return "The wallet does not support this network. Please select another one.";
      case BeaconErrorType.NO_ADDRESS_ERROR:
        return "The wallet does not have an account set up for this network.";
      case BeaconErrorType.NO_PRIVATE_KEY_FOUND_ERROR:
        return "The account you are trying to interact with is not available in the wallet.";
      case BeaconErrorType.NOT_GRANTED_ERROR:
        return "The wallet did not grant the necessary permissions for this action.";
      case BeaconErrorType.PARAMETERS_INVALID_ERROR:
        return "Some of the parameters provided are invalid and the request could not be completed.";
      case BeaconErrorType.TOO_MANY_OPERATIONS:
        return "The request contains too many operations to fit in a single batch.";
      case BeaconErrorType.UNKNOWN_ERROR:
      default:
        return "The wallet returned an unexpected error.";
    }
  }

  if (error instanceof Error) {
    // Strip leading "[ERROR_TYPE]:" prefix from BeaconError instances
    const stripped = error.message.replace(/^\[[A-Z0-9_]+\]:\s*/, "");
    return stripped || error.message;
  }

  if (typeof error === "object" && error !== null) {
    if (
      "description" in error &&
      typeof (error as { description: unknown }).description === "string"
    ) {
      return (error as { description: string }).description;
    }
    if (
      "message" in error &&
      typeof (error as { message: unknown }).message === "string"
    ) {
      return (error as { message: string }).message;
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

const initializeBeaconEvents = (
  beaconWallet: BeaconWallet,
  walletStore: WalletStoreState,
) => {
  beaconWallet.client.subscribeToEvent(
    BeaconEvent.ACTIVE_ACCOUNT_SET,
    (account) => {
      if (account) {
        walletStore.address.value = account.address;
      } else if (
        account === undefined &&
        walletStore.address.value &&
        !walletStore.isDisconnecting.value
      ) {
        walletStore.disconnectWallet(true);
      }
    },
  );

  beaconWallet.client.subscribeToEvent(
    BeaconEvent.LATE_RESPONSE_RECEIVED,
    (info: LateResponseInfo) => {
      handleLateResponse(info);
    },
  );

  beaconWallet.client.subscribeToEvent(
    BeaconEvent.INVALID_ACCOUNT_DEACTIVATED,
    async (event?: InvalidAccountDeactivatedEvent) => {
      if (
        (walletStore.address.value || walletStore.getWallet?.value) &&
        !walletStore.isDisconnecting.value
      ) {
        await walletStore.disconnectWallet(false);
      }
      if (event?.reason && event.reason !== "missing_active_account") {
        toast.warning("Wallet session deactivated", {
          description: describeInvalidAccountReason(event),
        });
      }
    },
  );
};

export { initializeBeaconEvents };
