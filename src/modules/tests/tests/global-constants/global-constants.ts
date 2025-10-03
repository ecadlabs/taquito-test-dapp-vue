import { getOperationHash } from "@/lib/utils";
import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import type { Estimate } from "@taquito/taquito";
import { PiggyBank } from "lucide-vue-next";

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
    diagramStore.setProgress("estimate-fees", "running");
    estimate = await Tezos.estimate.registerGlobalConstant({ value });

    if (estimate) {
      diagramStore.setNodeButton("estimate-fees", {
        icon: PiggyBank,
        text: "View Fees",
        onClick: () => diagramStore.showFeeEstimationDialog(estimate),
      });
    }

    diagramStore.setProgress("register-constant", "running");
    const operation = await Tezos.contract.registerGlobalConstant({ value });

    diagramStore.setProgress("wait-for-chain-confirmation", "running");
    const confirmation = await operation.confirmation(3);

    const opHash = getOperationHash(confirmation);
    if (opHash) {
      diagramStore.setOperationHash(opHash);
    }

    diagramStore.setCompleted();
    return operation.globalConstantHash;
  } catch (error) {
    console.error(`Error: ${JSON.stringify(error, null, 2)}`);
    diagramStore.setErrorMessage(error);
    throw error;
  }
};

/**
 * Generates a sample Michelson expression with some randomness to avoid
 * duplicates
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

export { generateSampleExpression, registerGlobalConstant };
