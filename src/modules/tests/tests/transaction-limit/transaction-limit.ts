import contracts from "@/contracts/contract-config.json";
import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import { type ContractConfig } from "@/types/contract";

const CONTRACT_ADDRESS =
  (contracts as ContractConfig[]).find(
    (contract: ContractConfig) => contract.contractName === "counter",
  )?.address ?? "";
const TEST_ID = "transaction-limit";

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

  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    diagramStore.setProgress("get-contract", "running", TEST_ID);
    const contract = await Tezos.wallet.at(CONTRACT_ADDRESS);

    diagramStore.setProgress("set-transaction-limit", "running", TEST_ID);
    diagramStore.setProgress("execute-operation", "running", TEST_ID);
    diagramStore.setProgress("wait-for-user", "running", TEST_ID);

    const operation = await contract.methodsObject.increment(1).send({
      storageLimit,
      gasLimit,
      fee,
    });

    diagramStore.setProgress("wait-chain-confirmation", "running", TEST_ID);
    const confirmation = await operation.confirmation(3);

    if (confirmation?.block.hash)
      diagramStore.setOperationHash(confirmation?.block.hash, TEST_ID);
    diagramStore.setCompleted(TEST_ID);
  } catch (error) {
    console.log(`Error: ${JSON.stringify(error, null, 2)}`);
    diagramStore.setErrorMessage(error, TEST_ID);
  }
};

export { interact };
