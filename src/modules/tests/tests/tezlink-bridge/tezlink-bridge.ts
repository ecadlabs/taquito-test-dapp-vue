import { getOperationHash } from "@/lib/utils";
import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import type { Estimate } from "@taquito/taquito";
import {
  b58DecodePublicKeyHash,
  validateAddress,
  ValidationResult,
} from "@taquito/utils";
import { getBridgeConfig } from "./bridge-config";

const TEST_ID = "tezlink-bridge";

/**
 * Encodes a Tezos address to the Tezlink ticket format used for deposits.
 *
 * Format: 01dad8019600 + type_tag + 20_byte_hash + c0
 *
 * - 01dad8019600: Fixed 6-byte prefix (ticket/exchanger identifier)
 * - Type_tag: 00 for tz1, 01 for tz2, 02 for tz3, 03 for tz4
 * - 20_byte_hash: The public key hash (from b58DecodePublicKeyHash)
 * - C0: Suffix byte
 *
 * @param address - A Tezos address (tz1, tz2, tz3, or tz4)
 * @returns The hex-encoded l2_address in Tezlink ticket format
 */
const encodeTezlinkAddress = (address: string): string => {
  // b58DecodePublicKeyHash returns: type_tag (1 byte) + pkh (20 bytes) as hex
  // e.g., "006b82198cb179e8306c1bedd08f12dc863f328886" for a tz1 address
  const decoded = b58DecodePublicKeyHash(address, "hex");

  // Build Tezlink format: prefix + decoded (tag + hash) + suffix
  return "01dad8019600" + decoded + "c0";
  // return decoded;
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
