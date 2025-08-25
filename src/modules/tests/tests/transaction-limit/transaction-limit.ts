import { useWalletStore } from "@/stores/walletStore";
import { useDiagramStore } from "@/stores/diagramStore";
import contracts from "@/contracts/contract-config.json";
import { type ContractConfig } from "@/types/contract";

const CONTRACT_ADDRESS =
  (contracts as ContractConfig[]).find(
    (contract: ContractConfig) => contract.contractName === "counter",
  )?.address ?? "";
const TEST_ID = "transaction-limit";

/**
 * Increments the contract storage value by the specified amount.
 *
 * @async
 * @param {number} amount - The amount to increment the storage by (must be between 1 and 100 inclusive).
 * @throws {Error} If the amount is not within the valid range.
 * @returns {Promise<void>}
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
    diagramStore.setProgress("success", "completed", TEST_ID);
  } catch (error) {
    console.log(`Error: ${JSON.stringify(error, null, 2)}`);
    diagramStore.setErrorMessage(error, TEST_ID);
  }
};

export { interact };
