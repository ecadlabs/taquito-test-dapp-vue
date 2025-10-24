import contracts from "@/contracts/contract-config.json";
import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import { type ContractConfig } from "@/types/contract";

const CONTRACT_ADDRESS =
  (contracts as ContractConfig[]).find(
    (contract: ContractConfig) => contract.contractName === "counter",
  )?.address ?? "";

/**
 * Attempts to call a contract with invalid parameters to test error handling.
 *
 * @async
 * @param {string} scenario - The type of failure scenario to test
 * @returns {Promise<void>} Resolves when the operation fails or errors are
 *   handled.
 */
const testContractFailure = async (scenario: string): Promise<void> => {
  const diagramStore = useDiagramStore();
  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    diagramStore.setProgress("get-contract");
    const contract = await Tezos.wallet.at(CONTRACT_ADDRESS);

    diagramStore.setProgress("execute-operation");
    switch (scenario) {
      case "wrong-type":
        // Try to pass a string instead of a number to increment
        await contract.methodsObject.increment("invalid").send();
        break;

      case "invalid-entrypoint":
        // Try to call a non-existent entrypoint
        await contract.methodsObject.nonExistentMethod().send();
        break;

      case "invalid-parameter-structure":
        // Try to pass wrong parameter structure
        await contract.methodsObject.increment({ invalid: "structure" }).send();
        break;

      default:
        throw new Error(`Unknown scenario: ${scenario}`);
    }

    throw new Error(
      "Operation unexpectedly succeeded. This should not happen, as this test is designed to fail.",
    );
  } catch (error) {
    console.log(
      `Expected contract call failure for scenario '${scenario}':`,
      JSON.stringify(error, null, 2),
    );
    diagramStore.setErrorMessage(error);
  }
};

export { testContractFailure };
