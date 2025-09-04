import { useWalletStore } from "@/stores/walletStore";
import { useDiagramStore } from "@/stores/diagramStore";
import contracts from "@/contracts/contract-config.json";
import { type ContractConfig } from "@/types/contract";

const CONTRACT_ADDRESS =
  (contracts as ContractConfig[]).find(
    (contract: ContractConfig) => contract.contractName === "counter",
  )?.address ?? "";
const TEST_ID = "failing-contract";

/**
 * Attempts to call a contract with invalid parameters to test error handling.
 *
 * @async
 * @param {string} scenario - The type of failure scenario to test
 * @returns {Promise<void>} Resolves when the operation fails or errors are handled.
 */
const testContractFailure = async (scenario: string): Promise<void> => {
  const diagramStore = useDiagramStore();
  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    diagramStore.setProgress("get-contract", "running", TEST_ID);
    const contract = await Tezos.wallet.at(CONTRACT_ADDRESS);

    let operation;

    diagramStore.setProgress("execute-operation", "running", TEST_ID);

    switch (scenario) {
      case "wrong-type":
        // Try to pass a string instead of a number to increment
        operation = await contract.methodsObject
          .increment("invalid" as any)
          .send();
        break;

      case "invalid-entrypoint":
        // Try to call a non-existent entrypoint
        operation = await (contract as any).methodsObject
          .nonExistentMethod()
          .send();
        break;

      case "invalid-parameter-structure":
        // Try to pass wrong parameter structure
        operation = await contract.methodsObject
          .increment({ invalid: "structure" } as any)
          .send();
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
    diagramStore.setErrorMessage(error, TEST_ID);
  }
};

export { testContractFailure };
