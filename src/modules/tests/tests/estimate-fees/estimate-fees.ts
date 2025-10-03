import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import type { Estimate } from "@taquito/taquito";
import { PiggyBank } from "lucide-vue-next";

const address = "tz1VRj54TQDtUGgv6gF4AbGbXMphyDpVkCpf";

let estimate: Estimate;
const estimateFees = async () => {
  const diagramStore = useDiagramStore();
  const walletStore = useWalletStore();

  const Tezos = walletStore.getTezos;

  try {
    diagramStore.setProgress("estimate-fees");
    estimate = await Tezos.estimate.transfer({ to: address, amount: 1 });

    if (estimate) {
      diagramStore.setNodeButton("estimate-fees", {
        icon: PiggyBank,
        text: "View Fees",
        onClick: () => diagramStore.showFeeEstimationDialog(estimate),
      });
    }

    diagramStore.setCompleted();
  } catch (error) {
    console.error(
      `Failed to estiimate fees for transfer to '${address}': ${error}`,
    );
    diagramStore.setErrorMessage(error);
    throw error;
  }
};

export { estimateFees };
