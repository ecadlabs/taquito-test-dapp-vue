import { useDiagramStore } from "@/stores/diagramStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useWalletStore } from "@/stores/walletStore";
import { RpcClient } from "@taquito/rpc";
import type { Estimate } from "@taquito/taquito";

const TEST_ID = "delegation";
let estimate: Estimate;

const delegate = async (address: string) => {
  const diagramStore = useDiagramStore();
  const settingsStore = useSettingsStore();
  diagramStore.setTestDiagram(TEST_ID, "set-delegate");

  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    if (!address) throw new Error("No address found to delegate to");
    if (!walletStore.getAddress)
      throw new Error("No address found to delegate from");

    estimate = await Tezos.estimate.setDelegate({
      source: walletStore.getAddress,
      delegate: address,
    });

    if (estimate) {
      diagramStore.setFeeEstimate(estimate);
    }

    diagramStore.setProgress("wait-for-user");
    const delegation = await Tezos.wallet
      .setDelegate({ delegate: address })
      .send();

    diagramStore.setProgress("set-delegate");
    diagramStore.setProgress("wait-for-chain-confirmation");
    const confirmation = await delegation.confirmation(
      settingsStore.getConfirmationCount,
    );

    if (confirmation?.block.hash)
      diagramStore.setOperationHash(confirmation?.block.hash);

    diagramStore.setCompleted();
  } catch (error) {
    console.error(`Failed to delegate to '${address}': ${error}`);
    diagramStore.setErrorMessage(error);
    throw error;
  }
};

const undelegate = async () => {
  const diagramStore = useDiagramStore();
  const settingsStore = useSettingsStore();
  diagramStore.setTestDiagram(TEST_ID, "remove-delegation");

  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    if (!walletStore.getAddress)
      throw new Error("No address found remove delegation for");

    estimate = await Tezos.estimate.setDelegate({
      source: walletStore.getAddress,
    });

    if (estimate) {
      diagramStore.setFeeEstimate(estimate);
    }

    diagramStore.setProgress("wait-for-user");
    const delegation = await Tezos.wallet.setDelegate({}).send();

    diagramStore.setProgress("remove-delegation");
    diagramStore.setProgress("wait-for-chain-confirmation");
    const confirmation = await delegation.confirmation(
      settingsStore.getConfirmationCount,
    );

    if (confirmation?.block.hash)
      diagramStore.setOperationHash(confirmation?.block.hash);

    diagramStore.setCompleted();
  } catch (error) {
    console.error(`Failed to undelegate: ${error}`);
    diagramStore.setErrorMessage(error);
    throw error;
  }
};

const getDelegate = async (address: string): Promise<string | null> => {
  const settingsStore = useSettingsStore();
  const rpc = new RpcClient(settingsStore.settings.rpcUrl);
  const delegate = await rpc.getDelegate(address);
  return delegate;
};

export { delegate, getDelegate, undelegate };
