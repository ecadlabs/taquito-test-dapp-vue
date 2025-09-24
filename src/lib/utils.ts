import { useSettingsStore, type IndexerOption } from "@/stores/settingsStore";
import type { Confirmation } from "@/types/wallet";
import { RpcClient } from "@taquito/rpc";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "vue-sonner";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const buildIndexerUrl = (
  indexer: IndexerOption,
  networkType: string,
  identifier?: string,
  routeType: "contract" | "operations" = "contract",
) => {
  if (indexer.value === "tzkt") {
    const baseUrl = indexer.url.replace("[networkType]", networkType);
    if (routeType === "operations") {
      return identifier ? `${baseUrl}/${identifier}/operations` : baseUrl;
    }
    return identifier ? `${baseUrl}/${identifier}/storage` : baseUrl;
  } else if (indexer.value === "tzstats") {
    let prefix = "";
    if (networkType === "ghostnet") {
      prefix = "ghost.";
    }

    const baseUrl = indexer.url.replace("[networkType]", prefix);
    if (routeType === "operations") {
      return identifier ? `${baseUrl}/${identifier}/operations` : baseUrl;
    }
    return identifier ? `${baseUrl}/${identifier}` : baseUrl;
  }
  throw new Error(`Unsupported indexer value: ${indexer.value}`);
};

export const isRevealed = async (address: string): Promise<boolean> => {
  const settingsStore = useSettingsStore();
  try {
    const rpc = new RpcClient(settingsStore.settings.rpcUrl);
    const managerKey = await rpc.getManagerKey(address);

    // If managerKey exists and is not null/undefined, the public key is revealed
    return !!managerKey;
  } catch {
    return false;
  }
};

export const getOperationHash = (confirmation: Confirmation) => {
  let opHash = "";
  if (typeof confirmation === "object" && confirmation?.block?.hash) {
    opHash = confirmation.block.hash;
  } else if (typeof confirmation === "number") {
    opHash = confirmation.toString();
  }
  return opHash;
};

/**
 * Copies text to clipboard with toast notifications
 *
 * @param text - The text to copy to clipboard
 * @param successMessage - Optional custom success message (default: "Copied to
 *   clipboard")
 * @param errorMessage - Optional custom error message (default: "Failed to copy
 *   to clipboard")
 */
export const copyToClipboard = async (
  text: string,
  successMessage: string = "Copied to clipboard",
  errorMessage: string = "Failed to copy to clipboard",
) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    toast.error(errorMessage);
  }
};

/**
 * Validates a Tezos address (tz1, tz2, tz3, tz4, KT1)
 *
 * @param address - The address string to validate
 * @returns True if valid, false otherwise
 */
export const validateTezosAddress = (address: string): boolean => {
  const tezosAddressPattern = /^(tz[1-4]|KT1)[0-9A-Za-z]{33}$/;
  return tezosAddressPattern.test(address);
};
