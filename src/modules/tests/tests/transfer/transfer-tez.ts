import { getOperationHash } from "@/lib/utils";
import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import type { Estimate, TransactionWalletOperation } from "@taquito/taquito";

let estimate: Estimate;
const send = async (to: string, amount: number) => {
  const diagramStore = useDiagramStore();
  const walletStore = useWalletStore();

  const Tezos = walletStore.getTezos;

  try {
    // Validate input parameters
    if (!to || amount <= 0) {
      throw new Error("Invalid recipient address or amount");
    }

    estimate = await Tezos.estimate.transfer({ to, amount: amount });

    if (estimate) {
      diagramStore.setFeeEstimate(estimate);
    }

    diagramStore.setProgress("wait-for-user");
    const transfer: TransactionWalletOperation = await Tezos.wallet
      .transfer({ to, amount })
      .send();

    diagramStore.setProgress("wait-for-chain-confirmation");
    const confirmation = await transfer.confirmation();

    const opHash = getOperationHash(confirmation);
    diagramStore.setOperationHash(opHash);
    diagramStore.setCompleted();
  } catch (error) {
    console.error(`Failed to send transfer to '${to}': ${error}`);
    diagramStore.setErrorMessage(error);
  }
};

export { send };
