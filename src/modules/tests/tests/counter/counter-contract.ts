import { useWalletStore } from "@/stores/walletStore";
import { useDiagramStore } from "@/stores/diagramStore";
import contracts from "@/contracts/contract-config.json";
import { type ContractConfig } from "@/types/contract";
import { PiggyBank } from "lucide-vue-next";
import type { Estimate } from "@taquito/taquito";

const CONTRACT_ADDRESS =
  contracts.find(
    (contract: ContractConfig) => contract.contractName === "counter",
  )?.address ?? "";
const TEST_ID = "counter-contract";

let estimate: Estimate;

/**
 * Increments the contract storage value by the specified amount.
 *
 * @async
 * @param {number} amount - The amount to increment the storage by (must be between 1 and 100 inclusive).
 * @throws {Error} If the amount is not within the valid range.
 * @returns {Promise<void>}
 */
const increment = async (amount: number): Promise<number | undefined> => {
  const diagramStore = useDiagramStore();

  if (amount <= 0 || amount > 100)
    throw new Error(
      "Incrementation value must be between 1 and 100 inclusive.",
    );

  diagramStore.setTestDiagram(TEST_ID, "increment");

  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    diagramStore.setProgress("get-contract", "running", TEST_ID);

    const contract = await Tezos.wallet.at(CONTRACT_ADDRESS);
    console.log(`Incrementing storage value by ${amount}...`);

    diagramStore.setProgress("estimate-fees", "running", TEST_ID);
    const transferParams = await contract.methodsObject
      .increment(amount)
      .toTransferParams();
    estimate = await Tezos.estimate.transfer(transferParams);

    if (estimate) {
      diagramStore.setNodeButton("estimate-fees", {
        icon: PiggyBank,
        text: "View Fees",
        onClick: () => diagramStore.showFeeEstimationDialog(estimate),
      });
    }

    diagramStore.setProgress("execute-operation", "running", TEST_ID);

    const operation = await contract.methodsObject.increment(amount).send();

    diagramStore.setProgress("wait-confirmation", "running", TEST_ID);
    const confirmation = await operation.confirmation(3);

    if (confirmation?.block.hash)
      diagramStore.setOperationHash(confirmation?.block.hash, TEST_ID);
    diagramStore.setProgress("success", "completed", TEST_ID);
    return await getContractStorage(true);
  } catch (error) {
    console.log(`Error: ${JSON.stringify(error, null, 2)}`);
    diagramStore.setErrorMessage(error, TEST_ID);
  }
};

/**
 * Decrements the contract storage value by the specified amount.
 *
 * @async
 * @param {number} amount - The amount to decrement the storage by (must be between 1 and 100 inclusive).
 * @throws {Error} If the amount is not within the valid range.
 * @returns {Promise<void>}
 */
const decrement = async (amount: number): Promise<number | undefined> => {
  const diagramStore = useDiagramStore();

  if (amount <= 0 || amount > 100)
    throw new Error(
      "Decrementation value must be between 1 and 100 inclusive.",
    );

  diagramStore.setTestDiagram(TEST_ID, "decrement");

  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    diagramStore.setProgress("get-contract", "running", TEST_ID);
    const contract = await Tezos.wallet.at(CONTRACT_ADDRESS);

    diagramStore.setProgress("estimate-fees", "running", TEST_ID);
    const transferParams = await contract.methodsObject
      .decrement(amount)
      .toTransferParams();
    estimate = await Tezos.estimate.transfer(transferParams);

    if (estimate) {
      diagramStore.setNodeButton("estimate-fees", {
        icon: PiggyBank,
        text: "View Fees",
        onClick: () => diagramStore.showFeeEstimationDialog(estimate),
      });
    }

    diagramStore.setProgress("execute-operation", "running", TEST_ID);
    const operation = await contract.methodsObject.decrement(amount).send();
    diagramStore.setProgress("wait-confirmation", "running", TEST_ID);
    const confirmation = await operation.confirmation(3);
    if (confirmation?.block.hash)
      diagramStore.setOperationHash(confirmation?.block.hash, TEST_ID);
    diagramStore.setProgress("success", "completed", TEST_ID);
    return await getContractStorage(true);
  } catch (error) {
    console.log(`Error: ${JSON.stringify(error, null, 2)}`);
    diagramStore.setErrorMessage(error, TEST_ID);
  }
};

/**
 * Resets the contract storage value to its initial state.
 *
 * @async
 * @returns {Promise<void>}
 */
const reset = async (): Promise<void> => {
  const diagramStore = useDiagramStore();

  diagramStore.setTestDiagram(TEST_ID, "reset");

  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    diagramStore.setProgress("get-contract", "running", TEST_ID);
    const contract = await Tezos.wallet.at(CONTRACT_ADDRESS);

    diagramStore.setProgress("estimate-fees", "running", TEST_ID);
    const transferParams = await contract.methodsObject
      .reset()
      .toTransferParams();
    estimate = await Tezos.estimate.transfer(transferParams);

    if (estimate) {
      diagramStore.setNodeButton("estimate-fees", {
        icon: PiggyBank,
        text: "View Fees",
        onClick: () => diagramStore.showFeeEstimationDialog(estimate),
      });
    }

    diagramStore.setProgress("execute-operation", "running", TEST_ID);
    const operation = await contract.methodsObject.reset().send();
    diagramStore.setProgress("wait-confirmation", "running", TEST_ID);
    const confirmation = await operation.confirmation(3);
    if (confirmation?.block.hash)
      diagramStore.setOperationHash(confirmation?.block.hash, TEST_ID);
    diagramStore.setProgress("success", "completed", TEST_ID);
  } catch (error) {
    console.log(`Error: ${JSON.stringify(error, null, 2)}`);
    diagramStore.setErrorMessage(error, TEST_ID);
  }
};

/**
 * Fetches and logs the current storage value of the contract.
 *
 * @async
 * @returns {Promise<void>}
 */
const getContractStorage = async (
  noDiagram?: boolean,
): Promise<number | undefined> => {
  const diagramStore = useDiagramStore();

  if (!noDiagram) diagramStore.setTestDiagram(TEST_ID, "get-storage");

  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    if (!noDiagram)
      diagramStore.setProgress("get-contract", "running", TEST_ID);

    const contract = await Tezos.wallet.at(CONTRACT_ADDRESS);
    const storage = await contract.storage();
    console.log(`Current storage value: ${storage}`);
    if (!noDiagram)
      diagramStore.setProgress("read-storage", "running", TEST_ID);
    if (!noDiagram) diagramStore.setProgress("success", "completed", TEST_ID);
    return storage as number;
  } catch (error) {
    console.log(`Error: ${error}`);
    diagramStore.setErrorMessage(error, TEST_ID);
  }
};

/**
 * Fetches and logs the available contract methods.
 *
 * @async
 * @returns {Promise<void>}
 */
const getContractMethods = async (): Promise<void> => {
  const diagramStore = useDiagramStore();

  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    // Set progress: Getting contract
    diagramStore.setProgress("get-contract", "running", TEST_ID);

    await Tezos.wallet
      .at(CONTRACT_ADDRESS)
      .then((c) => {
        const methods = c.parameterSchema.ExtractSignatures();
        console.log(JSON.stringify(methods, null, 2));
        diagramStore.setProgress("success", "completed", TEST_ID);
      })
      .catch((error) => {
        console.log(`Error: ${error}`);
      });
  } catch (error) {
    console.log(`Error: ${error}`);
    diagramStore.setErrorMessage(error, TEST_ID);
  }

  return;
};

export { increment, decrement, reset, getContractStorage, getContractMethods };
