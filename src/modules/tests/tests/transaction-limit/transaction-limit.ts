import { getContractAddress } from "@/networks/network-registry";
import { useDiagramStore } from "@/stores/diagramStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useWalletStore } from "@/stores/walletStore";

const NETWORK_ID =
  import.meta.env.VITE_NETWORK_NAME || import.meta.env.VITE_NETWORK_TYPE;
const CONTRACT_ADDRESS = getContractAddress("counter", NETWORK_ID) ?? "";

/**
 * Interacts with the contract using custom transaction limits.
 *
 * @async
 * @param {number} storageLimit - The storage limit to set for the transaction.
 * @param {number} gasLimit - The gas limit to set for the transaction.
 * @param {number} fee - The fee (in mutez) to set for the transaction.
 * @returns {Promise<void>} Resolves when the transaction is confirmed or fails
 *   with an error.
 */
const interact = async (
  storageLimit: number,
  gasLimit: number,
  fee: number,
): Promise<void> => {
  const diagramStore = useDiagramStore();
  const settingsStore = useSettingsStore();

  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    diagramStore.setProgress("get-contract");
    const contract = await Tezos.wallet.at(CONTRACT_ADDRESS);

    diagramStore.setProgress("set-transaction-limit");
    diagramStore.setProgress("execute-operation");
    diagramStore.setProgress("wait-for-user");

    const operation = await contract.methodsObject.increment(1).send({
      storageLimit,
      gasLimit,
      fee,
    });

    diagramStore.setProgress("wait-chain-confirmation");
    await operation.confirmation(settingsStore.getConfirmationCount);

    diagramStore.setOperationHash(operation.opHash);
    diagramStore.setCompleted();
  } catch (error) {
    console.error(`Error: ${JSON.stringify(error, null, 2)}`);
    diagramStore.setErrorMessage(error);
  }
};

export { interact };
