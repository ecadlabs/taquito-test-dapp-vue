import { getOperationHash } from "@/lib/utils";
import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import { packDataBytes } from "@taquito/michel-codec";
import type { Estimate } from "@taquito/taquito";
import { validateAddress, ValidationResult } from "@taquito/utils";
import { getBridgeConfig } from "./bridge-config";

const TEST_ID = "tezlink-bridge";

/**
 * Tezlink ticket format prefix for l2_address encoding. This is the format
 * expected by the Tezlink kernel for deposit destinations. Format: 01dad8019600
 * + address_type_byte + 20_byte_hash + suffix_byte
 */
const TEZLINK_TICKET_PREFIX = "01dad8019600";

/**
 * Encodes a Tezos address to the Tezlink ticket format used for deposits. This
 * format is different from standard Michelson PACK encoding.
 *
 * Format: 01dad8019600 + type_tag + 20_byte_hash + suffix
 *
 * - 01dad8019600: Fixed 6-byte prefix (ticket/exchanger identifier)
 * - Type_tag: 00 for tz1, 01 for tz2, 02 for tz3
 * - 20_byte_hash: The public key hash
 * - Suffix: c0 (purpose unclear, possibly padding)
 *
 * @param address - A Tezos address (tz1, tz2, or tz3)
 * @returns The hex-encoded l2_address in Tezlink ticket format
 */
const encodeTezlinkAddress = (address: string): string => {
  // Use packDataBytes to get the address bytes
  const packed = packDataBytes({ string: address }, { prim: "address" });

  // packDataBytes format: 050a00000016 (12 chars) + address_bytes (44 chars)
  // address_bytes format: type_tag (4 chars: 0000=tz1, 0001=tz2, 0002=tz3) + 20_byte_hash (40 chars)
  const addressBytes = packed.bytes.slice(12); // Remove "050a00000016" PACK prefix

  // Extract the type tag (first 2 bytes = 4 hex chars)
  const typeTagFull = addressBytes.slice(0, 4); // e.g., "0000" for tz1, "0001" for tz2

  // Extract the 20-byte hash (remaining 40 hex chars)
  const hash = addressBytes.slice(4);

  // Convert from standard type tag to Tezlink format
  // Standard: 0000 (tz1), 0001 (tz2), 0002 (tz3)
  // Tezlink: 00 (tz1), 01 (tz2), 02 (tz3)
  const tezlinkTypeTag = typeTagFull.slice(2); // Take last 2 chars

  // Suffix byte - observed as "c0" in Kukai deposits
  // This may be related to the address type or ticket format
  const suffix = "c0";

  // Build the Tezlink ticket format: prefix + type + hash + suffix
  const tezlinkEncoded = TEZLINK_TICKET_PREFIX + tezlinkTypeTag + hash + suffix;

  return tezlinkEncoded;
};

/**
 * Deposit XTZ from Tezos L1 to Tezlink
 *
 * @param amount - The amount of XTZ to deposit (in tez)
 * @param tezlinkAddress - The recipient's Tezlink wallet address
 * @returns Promise that resolves when the deposit is confirmed
 * @throws Error if the Tezlink address is invalid, amount is invalid, or
 *   transaction fails
 */
const depositToTezlink = async (
  amount: number,
  tezlinkAddress: string,
): Promise<void> => {
  const diagramStore = useDiagramStore();
  diagramStore.setTestDiagram(TEST_ID, "deposit");
  let estimate: Estimate;

  // Validate inputs
  if (
    !tezlinkAddress ||
    validateAddress(tezlinkAddress) !== ValidationResult.VALID
  ) {
    const error = new Error("Invalid Tezlink address");
    diagramStore.setErrorMessage(error);
    throw error;
  }

  if (amount <= 0) {
    const error = new Error("Amount must be greater than 0");
    diagramStore.setErrorMessage(error);
    throw error;
  }

  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  // Get bridge config for current network
  const networkType = import.meta.env.VITE_NETWORK_TYPE as string;
  const bridgeConfig = getBridgeConfig(networkType);

  if (!bridgeConfig) {
    const error = new Error(
      `Bridge not configured for network: ${networkType}. Currently only Shadownet is supported.`,
    );
    diagramStore.setErrorMessage(error);
    throw error;
  }

  try {
    diagramStore.setProgress("pack-tezlink-address");

    // Encode the Tezlink destination address to the ticket format
    const packedAddress = encodeTezlinkAddress(tezlinkAddress);

    // Build the transfer params directly with Michelson parameter
    // This bypasses Taquito's address validation which doesn't accept sr1 addresses
    const transferParams = {
      to: bridgeConfig.bridgeContract,
      amount: amount,
      parameter: {
        entrypoint: "deposit",
        value: {
          prim: "Pair",
          args: [
            { string: bridgeConfig.rollupAddress },
            { bytes: packedAddress },
          ],
        },
      },
    };

    diagramStore.setProgress("estimate-fees");
    estimate = await Tezos.estimate.transfer(transferParams);

    if (estimate) {
      diagramStore.setFeeEstimate(estimate);
    }

    diagramStore.setProgress("send-deposit-transaction");

    const op = await Tezos.wallet.transfer(transferParams).send();

    diagramStore.setProgress("wait-for-chain-confirmation");
    const confirmation = await op.confirmation();

    const opHash = getOperationHash(confirmation);
    diagramStore.setOperationHash(opHash);
    diagramStore.setCompleted();
  } catch (error) {
    console.error(`Failed to deposit to Tezlink: ${error}`);
    diagramStore.setErrorMessage(error);
    throw error;
  }
};

export { depositToTezlink };
