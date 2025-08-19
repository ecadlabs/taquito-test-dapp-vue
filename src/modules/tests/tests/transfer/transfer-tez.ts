import { useWalletStore } from "@/stores/walletStore";
import { useDiagramStore } from "@/stores/diagramStore";
import { PiggyBank } from "lucide-vue-next";
import type {
  Estimate,
  TransactionOperation,
  TransactionWalletOperation,
} from "@taquito/taquito";

const TEST_ID = "transfer";

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

    diagramStore.setProgress("estimate-fees", "running", TEST_ID);
    estimate = await Tezos.estimate.transfer({ to, amount: amount });

    if (estimate) {
      diagramStore.setNodeButton("estimate-fees", {
        icon: PiggyBank,
        text: "View Fees",
        onClick: () => diagramStore.showFeeEstimationDialog(estimate),
      });
    }

    diagramStore.setProgress("wait-for-user", "running", TEST_ID);
    let transfer: TransactionOperation | TransactionWalletOperation;
    if (walletStore.getWalletName === "Programmatic Wallet") {
      transfer = await Tezos.contract.transfer({ to, amount });
    } else {
      transfer = await Tezos.wallet.transfer({ to, amount }).send();
    }

    diagramStore.setProgress("wait-for-chain-confirmation", "running", TEST_ID);
    const confirmation = await transfer.confirmation();

    let opHash = "";
    if (typeof confirmation === "object" && confirmation?.block?.hash) {
      opHash = confirmation.block.hash;
    } else if (typeof confirmation === "number") {
      opHash = confirmation.toString();
    }

    diagramStore.setOperationHash(opHash, TEST_ID);
    diagramStore.setProgress("success", "completed", TEST_ID);
    await walletStore.fetchBalance();
  } catch (error) {
    console.error(`Failed to send transfer to '${to}': ${error}`);
    diagramStore.setErrorMessage(error, TEST_ID);
  }
};

export { send };
