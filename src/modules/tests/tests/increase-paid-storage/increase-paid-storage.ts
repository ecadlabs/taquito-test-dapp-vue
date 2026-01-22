import { useDiagramStore } from "@/stores/diagramStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useWalletStore } from "@/stores/walletStore";

const increaseStorage = async (contract: string, bytes: number) => {
  const diagramStore = useDiagramStore();
  const settingsStore = useSettingsStore();
  const walletStore = useWalletStore();

  const Tezos = walletStore.getTezos;

  try {
    // Validate input parameters
    if (!contract || bytes <= 0 || bytes > 10) {
      throw new Error("Invalid contract address or byte amount");
    }

    diagramStore.setProgress("wait-for-user");
    const operation = await Tezos.wallet
      .increasePaidStorage({ amount: bytes, destination: contract })
      .send();

    diagramStore.setProgress("wait-for-chain-confirmation");
    const confirmation = await operation.confirmation(
      settingsStore.getConfirmationCount,
    );
    if (confirmation?.block.hash)
      diagramStore.setOperationHash(confirmation?.block.hash);

    diagramStore.setCompleted();
  } catch (error) {
    console.error(
      `Failed to increase paid storage on contract '${contract}': ${error}`,
    );
    diagramStore.setErrorMessage(error);
    throw error;
  }
};

export { increaseStorage };
