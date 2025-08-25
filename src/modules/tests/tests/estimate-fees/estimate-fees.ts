import { useWalletStore } from "@/stores/walletStore";
import { useDiagramStore } from "@/stores/diagramStore";
import { PiggyBank } from "lucide-vue-next";
import type { Estimate } from "@taquito/taquito";

const TEST_ID = "estimate-fees";
const address = "tz1VRj54TQDtUGgv6gF4AbGbXMphyDpVkCpf";

let estimate: Estimate;
const estimateFees = async () => {
  const diagramStore = useDiagramStore();
  const walletStore = useWalletStore();

  const Tezos = walletStore.getTezos;

  try {
    diagramStore.setProgress("estimate-fees", "running", TEST_ID);
    estimate = await Tezos.estimate.transfer({ to: address, amount: 1 });

    if (estimate) {
      diagramStore.setNodeButton("estimate-fees", {
        icon: PiggyBank,
        text: "View Fees",
        onClick: () => diagramStore.showFeeEstimationDialog(estimate),
      });
    }

    diagramStore.setProgress("success", "completed", TEST_ID);
  } catch (error) {
    console.error(
      `Failed to estiimate fees for transfer to '${address}': ${error}`,
    );
    diagramStore.setErrorMessage(error, TEST_ID);
    throw error;
  }
};

export { estimateFees };
