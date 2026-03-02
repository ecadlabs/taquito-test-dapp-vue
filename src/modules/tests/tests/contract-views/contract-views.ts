import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";

const TEST_ID = "contract-views";

export interface ViewExecutionResult {
  viewName: string;
  parameter: unknown;
  result: unknown;
}

/**
 * Executes a contract view with the specified parameters.
 *
 * @param {string} contractAddress - The contract address
 * @param {string} viewName - Name of the view to execute
 * @param {unknown} parameter - Parameter to pass to the view (defaults to unit
 *   for no params)
 * @returns {Promise<ViewExecutionResult>} The view execution result containing
 *   viewName, parameter, and result
 */
const executeView = async (
  contractAddress: string,
  viewName: string,
  parameter: unknown = undefined,
): Promise<ViewExecutionResult> => {
  const diagramStore = useDiagramStore();
  const walletStore = useWalletStore();

  diagramStore.setTestDiagram(TEST_ID, "execute-view");

  try {
    diagramStore.setProgress("setup-contract");
    const Tezos = walletStore.getTezos;
    const contract = await Tezos.contract.at(contractAddress);

    diagramStore.setProgress("execute-view");

    const viewParam = parameter === undefined ? undefined : parameter;

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

    diagramStore.setCompleted();

    return {
      viewName,
      parameter: viewParam,
      result: viewResult,
    };
  } catch (error) {
    console.error(
      `Error executing view '${viewName}': ${JSON.stringify(error, null, 2)}`,
    );
    diagramStore.setErrorMessage(error);
    throw error;
  }
};

export { executeView };
