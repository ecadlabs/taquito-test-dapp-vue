import { getOperationHash } from "@/lib/utils";
import { useDiagramStore } from "@/stores/diagramStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useWalletStore } from "@/stores/walletStore";
import type { Estimate } from "@taquito/taquito";

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
  const settingsStore = useSettingsStore();
  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    estimate = await Tezos.estimate.registerGlobalConstant({ value });

    if (estimate) {
      diagramStore.setFeeEstimate(estimate);
    }

    diagramStore.setProgress("register-constant");
    const operation = await Tezos.wallet
      .registerGlobalConstant({ value })
      .send();

    diagramStore.setProgress("wait-for-chain-confirmation");
    const confirmation = await operation.confirmation(
      settingsStore.getConfirmationCount,
    );

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
