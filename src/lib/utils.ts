import type { IndexerOption } from "@/stores/settingsStore";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { RpcClient } from "@taquito/rpc";
import type { Confirmation } from "@/types/wallet";

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
  try {
    const rpc = new RpcClient(import.meta.env.VITE_RPC_URL);
    const managerKey = await rpc.getManagerKey(address);

    // If managerKey exists and is not null/undefined, the public key is revealed
    return !!managerKey;
  } catch (error) {
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
