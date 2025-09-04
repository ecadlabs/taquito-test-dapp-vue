import { useWalletStore } from "@/stores/walletStore";
import { useDiagramStore } from "@/stores/diagramStore";
import { getOperationHash } from "@/lib/utils";
import { PiggyBank } from "lucide-vue-next";
import type { Estimate } from "@taquito/taquito";

const TEST_ID = "global-constants";

let estimate: Estimate;

/**
 * Registers a global constant with a Michelson expression
 *
 * @async
 * @param {object} value - The Michelson expression to register
 * @returns {Promise<string | undefined>} The hash of the registered constant
 */
const registerGlobalConstant = async (
  value: object,
): Promise<string | undefined> => {
  const diagramStore = useDiagramStore();
  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    diagramStore.setProgress("estimate-fees", "running", TEST_ID);
    estimate = await Tezos.estimate.registerGlobalConstant({ value });

    if (estimate) {
      diagramStore.setNodeButton("estimate-fees", {
        icon: PiggyBank,
        text: "View Fees",
        onClick: () => diagramStore.showFeeEstimationDialog(estimate),
      });
    }

    diagramStore.setProgress("register-constant", "running", TEST_ID);
    const operation = await Tezos.contract.registerGlobalConstant({ value });

    diagramStore.setProgress("wait-for-chain-confirmation", "running", TEST_ID);
    const confirmation = await operation.confirmation(3);

    const opHash = getOperationHash(confirmation);
    if (opHash) {
      diagramStore.setOperationHash(opHash, TEST_ID);
    }

    diagramStore.setProgress("success", "completed", TEST_ID);
    return operation.globalConstantHash;
  } catch (error) {
    console.error(`Error: ${JSON.stringify(error, null, 2)}`);
    diagramStore.setErrorMessage(error, TEST_ID);
    throw error;
  }
};

/**
 * Generates a sample Michelson expression with some randomness to avoid duplicates
 *
 * @returns {object} A sample Michelson expression
 */
const generateSampleExpression = (): object => {
  // Generate a random number to add uniqueness
  const randomValue = Math.floor(Math.random() * 1000000);

  return {
    prim: "pair",
    args: [
      { prim: "int" },
      {
        prim: "or",
        args: [{ prim: "string" }, { prim: "nat" }],
      },
    ],
    annots: [`%random_${randomValue}`],
  };
};

export { registerGlobalConstant, generateSampleExpression };
