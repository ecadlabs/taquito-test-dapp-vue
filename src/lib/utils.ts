import { useSettingsStore, type IndexerOption } from "@/stores/settingsStore";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { RpcClient } from "@taquito/rpc";
import type { Confirmation } from "@/types/wallet";
import { toast } from "vue-sonner";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const buildIndexerUrl = (
  indexer: IndexerOption,
  networkType: string,
) => {
  return indexer.url.replace("[networkType]", networkType);
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
 * @param text - The text to copy to clipboard
 * @param successMessage - Optional custom success message (default: "Copied to clipboard")
 * @param errorMessage - Optional custom error message (default: "Failed to copy to clipboard")
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
 * @param address - The address string to validate
 * @returns true if valid, false otherwise
 */
export const validateTezosAddress = (address: string): boolean => {
  const tezosAddressPattern = /^(tz[1-4]|KT1)[0-9A-Za-z]{33}$/;
  return tezosAddressPattern.test(address);
};
