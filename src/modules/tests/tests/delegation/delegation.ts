import { useWalletStore } from "@/stores/walletStore";
import { useDiagramStore } from "@/stores/diagramStore";
import { PiggyBank } from "lucide-vue-next";
import type { Estimate } from "@taquito/taquito";
import { RpcClient } from "@taquito/rpc";
import { useSettingsStore } from "@/stores/settingsStore";

const TEST_ID = "delegation";
let estimate: Estimate;

const delegate = async (address: string) => {
  const diagramStore = useDiagramStore();
  diagramStore.setTestDiagram(TEST_ID, "set-delegate");

  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    if (!address) throw new Error("No address found to delegate to");
    if (!walletStore.getAddress)
      throw new Error("No address found to delegate from");

    diagramStore.setProgress("estimate-fees", "running", TEST_ID);
    estimate = await Tezos.estimate.setDelegate({
      source: walletStore.getAddress,
      delegate: address,
    });

    if (estimate) {
      diagramStore.setNodeButton("estimate-fees", {
        icon: PiggyBank,
        text: "View Fees",
        onClick: () => diagramStore.showFeeEstimationDialog(estimate),
      });
    }

    diagramStore.setProgress("set-delegate", "running", TEST_ID);
    diagramStore.setProgress("wait-for-user", "running", TEST_ID);
    const delegation = await Tezos.wallet
      .setDelegate({ delegate: address })
      .send();

    diagramStore.setProgress("wait-for-chain-confirmation", "running", TEST_ID);
    const confirmation = await delegation.confirmation();

    if (confirmation?.block.hash)
      diagramStore.setOperationHash(confirmation?.block.hash, TEST_ID);

    diagramStore.setProgress("success", "completed", TEST_ID);
  } catch (error) {
    console.error(`Failed to delegate to '${address}': ${error}`);
    diagramStore.setErrorMessage(error, TEST_ID);
    throw error;
  }
};

const undelegate = async () => {
  const diagramStore = useDiagramStore();
  diagramStore.setTestDiagram(TEST_ID, "remove-delegation");

  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    if (!walletStore.getAddress)
      throw new Error("No address found remove delegation for");

    diagramStore.setProgress("estimate-fees", "running", TEST_ID);
    estimate = await Tezos.estimate.setDelegate({
      source: walletStore.getAddress,
    });

    if (estimate) {
      diagramStore.setNodeButton("estimate-fees", {
        icon: PiggyBank,
        text: "View Fees",
        onClick: () => diagramStore.showFeeEstimationDialog(estimate),
      });
    }

    diagramStore.setProgress("remove-delegation", "running", TEST_ID);
    diagramStore.setProgress("wait-for-user", "running", TEST_ID);
    const delegation = await Tezos.wallet.setDelegate({}).send();

    diagramStore.setProgress("wait-for-chain-confirmation", "running", TEST_ID);
    const confirmation = await delegation.confirmation();

    if (confirmation?.block.hash)
      diagramStore.setOperationHash(confirmation?.block.hash, TEST_ID);

    diagramStore.setProgress("success", "completed", TEST_ID);
  } catch (error) {
    console.error(`Failed to undelegate: ${error}`);
    diagramStore.setErrorMessage(error, TEST_ID);
    throw error;
  }
};

const getDelegate = async (address: string): Promise<string | null> => {
  const settingsStore = useSettingsStore();
  const rpc = new RpcClient(settingsStore.settings.rpcUrl);
  const delegate = await rpc.getDelegate(address);
  return delegate;
};

export { delegate, undelegate, getDelegate };
