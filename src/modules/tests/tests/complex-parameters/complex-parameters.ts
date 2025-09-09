import { useWalletStore } from "@/stores/walletStore";
import { useDiagramStore } from "@/stores/diagramStore";
import contracts from "@/contracts/contract-config.json";
import {
  type ContractConfig,
  type UserRecord,
  type NestedRecord,
} from "@/types/contract";
import { PiggyBank } from "lucide-vue-next";
import type { Estimate } from "@taquito/taquito";

const CONTRACT_ADDRESS =
  (contracts as ContractConfig[]).find(
    (contract: ContractConfig) =>
      contract.contractName === "complex-parameters",
  )?.address ?? "";
const TEST_ID = "complex-parameters";

let estimate: Estimate;

// Type definitions for complex parameters
export interface RecordParam {
  name: string;
  age: number;
  active: boolean;
}

/**
 * Adds a user record to the contract with simple parameters.
 *
 * @param {RecordParam} record - The user record to add, containing name, age, and active status.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
const addUserRecord = async (record: RecordParam): Promise<void> => {
  const diagramStore = useDiagramStore();
  diagramStore.setTestDiagram(TEST_ID, "add-record");

  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    diagramStore.setProgress("get-contract", "running", TEST_ID);
    const contract = await Tezos.wallet.at(CONTRACT_ADDRESS);

    diagramStore.setProgress("estimate-fees", "running", TEST_ID);
    const transferParams = await contract.methodsObject
      .add_user_record(record)
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
    const operation = await contract.methodsObject
      .add_user_record(record)
      .send();

    diagramStore.setProgress("wait-confirmation", "running", TEST_ID);
    const confirmation = await operation.confirmation(3);

    if (confirmation?.block.hash) {
      diagramStore.setOperationHash(confirmation.block.hash, TEST_ID);
    }
    diagramStore.setProgress("success", "completed", TEST_ID);
  } catch (error) {
    console.error(`Error: ${JSON.stringify(error, null, 2)}`);
    diagramStore.setErrorMessage(error, TEST_ID);
  }
};

/**
 * Sets a complex nested record in the contract storage.
 *
 * @param {NestedRecord} nestedRecord - The nested record object containing metadata and permissions arrays.
 * @returns {Promise<void>} Resolves when the operation is confirmed or logs an error if it fails.
 */
const setNestedRecord = async (nestedRecord: NestedRecord): Promise<void> => {
  const diagramStore = useDiagramStore();
  diagramStore.setTestDiagram(TEST_ID, "set-nested-record");

  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    diagramStore.setProgress("get-contract", "running", TEST_ID);
    const contract = await Tezos.wallet.at(CONTRACT_ADDRESS);
    const cleanString = (str: string) => str.replace(/[^\x20-\x7E]/g, ""); // Keep only printable ASCII

    const complexData = {
      metadata: {
        created_at: new Date().toISOString(),
        updated_at: null,
        tags:
          nestedRecord.metadata.tags.length > 0
            ? nestedRecord.metadata.tags
                .map((tag) => cleanString(tag))
                .filter((tag) => tag.length > 0)
            : ["default"],
      },
      permissions:
        nestedRecord.permissions.length > 0
          ? nestedRecord.permissions
              .map((perm) => cleanString(perm))
              .filter((perm) => perm.length > 0)
          : ["read"],
    };

    diagramStore.setProgress("estimate-fees", "running", TEST_ID);
    const transferParams = await contract.methodsObject
      .set_nested_record(complexData)
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
    const operation = await contract.methodsObject
      .set_nested_record(complexData)
      .send();

    diagramStore.setProgress("wait-confirmation", "running", TEST_ID);
    const confirmation = await operation.confirmation(3);

    if (confirmation?.block.hash) {
      diagramStore.setOperationHash(confirmation.block.hash, TEST_ID);
    }
    diagramStore.setProgress("success", "completed", TEST_ID);
  } catch (error) {
    console.error(`Error: ${JSON.stringify(error, null, 2)}`);
    diagramStore.setErrorMessage(error, TEST_ID);
  }
};

/**
 * Adds or removes a user address from the authorized users set in the contract.
 *
 * @param action - The action to perform: "add" to include the user, "remove" to remove the user.
 * @param userAddress - The Tezos address of the user to add or remove from the set.
 * @returns A Promise that resolves when the operation is complete.
 */
const manageUserSet = async (
  action: "add" | "remove",
  userAddress: string,
): Promise<void> => {
  const diagramStore = useDiagramStore();
  diagramStore.setTestDiagram(TEST_ID, "manage-user-set");

  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    diagramStore.setProgress("get-contract", "running", TEST_ID);
    const contract = await Tezos.wallet.at(CONTRACT_ADDRESS);

    const params = {
      action,
      user: userAddress,
    };

    diagramStore.setProgress("estimate-fees", "running", TEST_ID);
    const transferParams = await contract.methodsObject
      .manage_authorization(params)
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
    const operation = await contract.methodsObject
      .manage_authorization(params)
      .send();

    diagramStore.setProgress("wait-confirmation", "running", TEST_ID);
    const confirmation = await operation.confirmation(3);

    if (confirmation?.block.hash) {
      diagramStore.setOperationHash(confirmation.block.hash, TEST_ID);
    }
    diagramStore.setProgress("success", "completed", TEST_ID);
  } catch (error) {
    console.error(`Error: ${JSON.stringify(error, null, 2)}`);
    diagramStore.setErrorMessage(error, TEST_ID);
  }
};

/**
 * Updates the contract's metadata map with the provided key-value pairs.
 *
 * @param updates - An object containing metadata key-value pairs to update in the contract.
 * @returns A Promise that resolves when the operation is complete.
 */
const updateMetadata = async (
  updates: Record<string, string>,
): Promise<void> => {
  const diagramStore = useDiagramStore();
  diagramStore.setTestDiagram(TEST_ID, "update-metadata");

  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    diagramStore.setProgress("get-contract", "running", TEST_ID);
    const contract = await Tezos.wallet.at(CONTRACT_ADDRESS);

    diagramStore.setProgress("estimate-fees", "running", TEST_ID);
    const transferParams = await contract.methodsObject
      .update_metadata(updates)
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
    const operation = await contract.methodsObject
      .update_metadata(updates)
      .send();

    diagramStore.setProgress("wait-confirmation", "running", TEST_ID);
    const confirmation = await operation.confirmation(3);

    if (confirmation?.block.hash) {
      diagramStore.setOperationHash(confirmation.block.hash, TEST_ID);
    }
    diagramStore.setProgress("success", "completed", TEST_ID);
  } catch (error) {
    console.error(`Error: ${JSON.stringify(error, null, 2)}`);
    diagramStore.setErrorMessage(error, TEST_ID);
  }
};

/**
 * Retrieves a user record from the contract storage.
 *
 * @param {string} userAddress - The Tezos address of the user whose record should be fetched.
 * @returns {Promise<UserRecord | null>} Resolves with the user record if found, or null if an error occurs.
 */
const getUserRecord = async (
  userAddress: string,
): Promise<UserRecord | null> => {
  const diagramStore = useDiagramStore();
  diagramStore.setTestDiagram(TEST_ID, "get-user-record");

  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    diagramStore.setProgress("get-contract", "running", TEST_ID);
    const contract = await Tezos.wallet.at(CONTRACT_ADDRESS);

    diagramStore.setProgress("read-storage", "running", TEST_ID);
    const result = await contract.contractViews
      .get_user_record(userAddress)
      .executeView({ viewCaller: userAddress });

    diagramStore.setProgress("success", "completed", TEST_ID);
    return result;
  } catch (error) {
    console.error(`Error: ${JSON.stringify(error, null, 2)}`);
    diagramStore.setErrorMessage(error, TEST_ID);
    return null;
  }
};

/**
 * Retrieves complex (nested) data for a specific user from the contract storage.
 *
 * @param {string} userAddress - The Tezos address for which to retrieve nested data.
 * @returns {Promise<NestedRecord | null>} Resolves with the nested record data if found, or null if an error occurs.
 */
const getNestedData = async (
  userAddress: string,
): Promise<NestedRecord | null> => {
  const diagramStore = useDiagramStore();
  diagramStore.setTestDiagram(TEST_ID, "get-nested-data");

  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    diagramStore.setProgress("get-contract", "running", TEST_ID);
    const contract = await Tezos.wallet.at(CONTRACT_ADDRESS);

    diagramStore.setProgress("read-storage", "running", TEST_ID);
    const result = await contract.contractViews
      .get_nested_record(userAddress)
      .executeView({ viewCaller: userAddress });

    diagramStore.setProgress("success", "completed", TEST_ID);
    return result;
  } catch (error) {
    console.error(`Error: ${JSON.stringify(error, null, 2)}`);
    diagramStore.setErrorMessage(error, TEST_ID);
    return null;
  }
};

/**
 * Retrieves all metadata from the contract storage.
 *
 * @returns {Promise<Record<string, string> | null>} Resolves with the metadata object if found, or null if an error occurs.
 */
const getAllMetadata = async (): Promise<Record<string, string> | null> => {
  const diagramStore = useDiagramStore();
  diagramStore.setTestDiagram(TEST_ID, "get-all-metadata");

  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    diagramStore.setProgress("get-contract", "running", TEST_ID);
    const contract = await Tezos.wallet.at(CONTRACT_ADDRESS);
    const address = walletStore.getAddress;
    if (!address) {
      throw new Error("No wallet address found");
    }

    diagramStore.setProgress("read-storage", "running", TEST_ID);

    // The result type is expected to have a valueMap property of type Map<string, string>
    type MetadataViewResult = { valueMap: Map<string, string> };

    const result = (await contract.contractViews
      .get_all_metadata(undefined)
      .executeView({ viewCaller: address })) as MetadataViewResult;

    const cleanMetadata: Record<string, string> = {};

    if (result && result.valueMap instanceof Map) {
      for (const [key, value] of result.valueMap.entries()) {
        const cleanKey = key.replace(/^"(.*)"$/, "$1");
        cleanMetadata[cleanKey] = value;
      }
    } else {
      throw new Error("Result is not a map");
    }

    diagramStore.setProgress("success", "completed", TEST_ID);
    return cleanMetadata;
  } catch (error) {
    console.error(`Error: ${JSON.stringify(error, null, 2)}`);
    diagramStore.setErrorMessage(error, TEST_ID);
    return null;
  }
};

export {
  addUserRecord,
  setNestedRecord,
  manageUserSet,
  updateMetadata,
  getUserRecord,
  getNestedData,
  getAllMetadata,
};
