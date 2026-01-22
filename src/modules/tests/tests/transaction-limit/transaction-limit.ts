import contracts from "@/contracts/contract-config.json";
import { useDiagramStore } from "@/stores/diagramStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useWalletStore } from "@/stores/walletStore";
import { type ContractConfig } from "@/types/contract";

const CONTRACT_ADDRESS =
  (contracts as ContractConfig[]).find(
    (contract: ContractConfig) => contract.contractName === "counter",
  )?.address ?? "";

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
    const confirmation = await operation.confirmation(
      settingsStore.getConfirmationCount,
    );

    if (confirmation?.block.hash)
      diagramStore.setOperationHash(confirmation?.block.hash);
    diagramStore.setCompleted();
  } catch (error) {
    console.error(`Error: ${JSON.stringify(error, null, 2)}`);
    diagramStore.setErrorMessage(error);
  }
};

export { interact };
