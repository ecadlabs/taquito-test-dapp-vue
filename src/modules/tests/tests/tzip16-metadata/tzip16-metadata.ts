import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import { tzip16 } from "@taquito/tzip16";

const TEST_ID = "tzip16-metadata";

export interface ContractMetadata {
  name?: string;
  description?: string;
  version?: string;
  license?: string;
  authors?: string[];
  homepage?: string;
  interfaces?: string[];
  views?: unknown[];
  [key: string]: unknown;
}

export interface MetadataResult {
  metadata: ContractMetadata;
}

export interface ViewExecutionResult {
  viewName: string;
  parameter: unknown;
  result: unknown;
}

/**
 * Retrieves TZIP-16 metadata from a contract using the specified contract
 * address.
 *
 * @param {string} contractAddress - The address of the contract to retrieve
 *   metadata from
 * @returns {Promise<MetadataResult>} The metadata result containing metadata
 */
const getContractMetadata = async (
  contractAddress: string,
): Promise<MetadataResult | undefined> => {
  const diagramStore = useDiagramStore();
  const walletStore = useWalletStore();

  diagramStore.setTestDiagram(TEST_ID, "get-metadata");

  try {
    const Tezos = walletStore.getTezos;

    diagramStore.setProgress("get-contract", "running", TEST_ID);

    const contract = await Tezos.wallet.at(contractAddress, tzip16);

    diagramStore.setProgress("retrieve-metadata", "running", TEST_ID);
    const metadata = (await contract.tzip16().getMetadata()).metadata;

    diagramStore.setProgress("success", "completed", TEST_ID);

    return {
      metadata: metadata as ContractMetadata,
    };
  } catch (error) {
    console.error(
      `Error retrieving metadata: ${JSON.stringify(error, null, 2)}`,
    );
    diagramStore.setErrorMessage(error, TEST_ID);
  }
};

/**
 * Executes a metadata view on the contract.
 *
 * @param {string} contractAddress - The contract address
 * @param {string} viewName - Name of the view to execute
 * @param {unknown} parameter - Parameter to pass to the view (defaults to unit
 *   for no params)
 * @returns {Promise<ViewExecutionResult>} The view execution result containing
 *   viewName, parameter, and result
 */
const executeMetadataView = async (
  contractAddress: string,
  viewName: string,
  parameter: unknown = undefined,
): Promise<ViewExecutionResult> => {
  const diagramStore = useDiagramStore();
  const walletStore = useWalletStore();

  diagramStore.setTestDiagram(TEST_ID, "execute-view");

  try {
    diagramStore.setProgress("setup-contract", "running", TEST_ID);

    // Get Tezos instance
    const Tezos = walletStore.getTezos;

    // Get contract instance
    const contract = await Tezos.contract.at(contractAddress);

    diagramStore.setProgress("execute-view", "running", TEST_ID);

    // Execute the view
    // For views that take no parameters, use undefined or unit
    const viewParam = parameter === undefined ? undefined : parameter;

    // Get the current wallet address for view execution context
    const walletAddress = walletStore.getAddress;
    if (!walletAddress) {
      throw new Error(
        "Wallet not connected. Please connect your wallet to execute views.",
      );
    }

    const viewResult = await contract.contractViews[viewName](
      viewParam,
    ).executeView({
      viewCaller: walletAddress,
    });

    diagramStore.setProgress("success", "completed", TEST_ID);

    return {
      viewName,
      parameter: viewParam,
      result: viewResult,
    };
  } catch (error) {
    console.error(
      `Error executing view '${viewName}': ${JSON.stringify(error, null, 2)}`,
    );
    diagramStore.setErrorMessage(error, TEST_ID);
    throw error;
  }
};

export { executeMetadataView, getContractMetadata };
