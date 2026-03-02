import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import { tzip16 } from "@taquito/tzip16";

const TEST_ID = "tzip16-metadata";

export interface ContractMetadata {
  name?: string;
  description?: string;
  version?: string;
  license?: string;
  authors?: string[];
  homepage?: string;
  interfaces?: string[];
  views?: unknown[];
  [key: string]: unknown;
}

export interface MetadataResult {
  metadata: ContractMetadata;
}

/**
 * Retrieves TZIP-16 metadata from a contract using the specified contract
 * address.
 *
 * @param {string} contractAddress - The address of the contract to retrieve
 *   metadata from
 * @returns {Promise<MetadataResult>} The metadata result containing metadata
 */
const getContractMetadata = async (
  contractAddress: string,
): Promise<MetadataResult | undefined> => {
  const diagramStore = useDiagramStore();
  const walletStore = useWalletStore();

  diagramStore.setTestDiagram(TEST_ID, "get-metadata");

  try {
    const Tezos = walletStore.getTezos;

    diagramStore.setProgress("get-contract");

    const contract = await Tezos.wallet.at(contractAddress, tzip16);

    diagramStore.setProgress("retrieve-metadata");
    const metadata = (await contract.tzip16().getMetadata()).metadata;

    diagramStore.setCompleted();

    return {
      metadata: metadata as ContractMetadata,
    };
  } catch (error) {
    console.error(
      `Error retrieving metadata: ${JSON.stringify(error, null, 2)}`,
    );
    diagramStore.setErrorMessage(error);
  }
};

export { getContractMetadata };
