import contracts from "@/contracts/contract-config.json";
import { getOperationHash } from "@/lib/utils";
import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import type { ContractConfig } from "@/types/contract";

const CONTRACT_ADDRESS =
  (contracts as ContractConfig[]).find(
    (contract: ContractConfig) => contract.contractName === "counter",
  )?.address ?? "";

/**
 * Sends a batch group of operations together.
 *
 * @async
 * @returns {Promise<void>}
 */
const sendBatch = async (): Promise<void> => {
  const diagramStore = useDiagramStore();
  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    diagramStore.setProgress("create-batch");
    const batch = Tezos.wallet.batch();

    if (!walletStore.getAddress) throw new Error("No wallet address found");

    const contract = await Tezos.wallet.at(CONTRACT_ADDRESS);

    diagramStore.setProgress("add-operations");
    batch.withTransfer({ to: walletStore.getAddress, amount: 1 });
    batch.withContractCall(contract.methodsObject.increment(1));

    diagramStore.setProgress("wait-for-user");
    const batchOp = await batch.send();

    diagramStore.setProgress("wait-for-chain-confirmation");
    await batchOp.confirmation();
    const opHash = getOperationHash(batchOp);
    diagramStore.setOperationHash(opHash);
    diagramStore.setCompleted();
  } catch (error) {
    console.error(`Error: ${JSON.stringify(error, null, 2)}`);
    diagramStore.setErrorMessage(error);
  }
};

export { sendBatch };
