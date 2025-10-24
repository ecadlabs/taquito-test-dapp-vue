import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";

export interface Transaction {
  kind: string;
  source?: string;
  destination?: string;
  amount?: string;
  fee?: string;
  counter?: string;
  gas_limit?: string;
  storage_limit?: string;
  hash?: string;
}

export interface TransactionList {
  transactions: Transaction[];
  blockNumber: number;
  transactionCount: number;
}

const getBlock = async (blockNumber?: number): Promise<TransactionList> => {
  const diagramStore = useDiagramStore();
  const walletStore = useWalletStore();

  const Tezos = walletStore.getTezos;

  try {
    diagramStore.setProgress("fetch-block");

    const block = await Tezos.rpc.getBlock(
      blockNumber ? { block: blockNumber.toString() } : undefined,
    );

    if (block) {
      const transactionOperations = block.operations
        .flat()
        .flatMap((operation) =>
          (operation.contents || [])
            .filter((content) => content.kind === "transaction")
            .map((content) => ({
              ...content,
              hash: operation.hash,
            })),
        );

      console.log("Transaction Operations:", transactionOperations);

      const transactionInfo: TransactionList = {
        transactions: transactionOperations,
        blockNumber: block.header.level,
        transactionCount: transactionOperations.length,
      };

      diagramStore.setCompleted();
      return transactionInfo;
    }

    throw new Error("No block data received");
  } catch (error) {
    console.error(`Failed to fetch block ${blockNumber}: ${error}`);
    diagramStore.setErrorMessage(error);
    throw error;
  }
};

export { getBlock };
