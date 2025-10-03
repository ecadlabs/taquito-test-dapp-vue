import contracts from "@/contracts/contract-config.json";
import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import type { FA2TokenStorage } from "@/types/contract";
import {
  type BalanceCallbackStorage,
  type ContractConfig,
} from "@/types/contract";
import type { Estimate } from "@taquito/taquito";
import { PiggyBank } from "lucide-vue-next";

const CONTRACT_ADDRESS =
  (contracts as ContractConfig[]).find(
    (contract: ContractConfig) => contract.contractName === "fa2-token",
  )?.address ?? "";

const CALLBACK_CONTRACT_ADDRESS =
  (contracts as ContractConfig[]).find(
    (contract: ContractConfig) => contract.contractName === "balance-callback",
  )?.address ?? "";

const TEST_ID = "fa2-token";

let estimate: Estimate;

// Types for FA2 operations
export interface TokenBalance {
  owner: string;
  token_id: string;
  balance: string;
}

export interface TransferDestination {
  to_: string;
  token_id: string;
  amount: string;
}

export interface TransferParam {
  from_: string;
  txs: TransferDestination[];
}

export interface MintParam {
  to_: string;
  token_id: string;
  amount: string;
}

export interface BurnParam {
  from_: string;
  token_id: string;
  amount: string;
}

/**
 * Mints tokens to a specified address
 *
 * @param param - Mint parameters
 * @returns Promise<void>
 */
export const mintTokens = async (param: MintParam): Promise<void> => {
  const diagramStore = useDiagramStore();
  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    diagramStore.setTestDiagram(TEST_ID, "mint");
    diagramStore.setProgress("get-contract", "running");

    const contract = await Tezos.wallet.at(CONTRACT_ADDRESS);

    diagramStore.setProgress("estimate-fees", "running");
    const transferParams = await contract.methodsObject
      .mint(param)
      .toTransferParams();
    estimate = await Tezos.estimate.transfer(transferParams);

    if (estimate) {
      diagramStore.setNodeButton("estimate-fees", {
        icon: PiggyBank,
        text: "View Fees",
        onClick: () => diagramStore.showFeeEstimationDialog(estimate),
      });
    }

    diagramStore.setProgress("execute-operation", "running");
    const operation = await contract.methodsObject.mint(param).send();

    diagramStore.setProgress("wait-confirmation", "running");
    const confirmation = await operation.confirmation(3);

    if (confirmation?.block.hash) {
      diagramStore.setOperationHash(confirmation?.block.hash);
    }
    diagramStore.setCompleted();
  } catch (error) {
    console.error(`Error: ${JSON.stringify(error, null, 2)}`);
    diagramStore.setErrorMessage(error);
  }
};

/**
 * Burns tokens from a specified address
 *
 * @param param - Burn parameters
 * @returns Promise<void>
 */
export const burnTokens = async (param: BurnParam): Promise<void> => {
  const diagramStore = useDiagramStore();
  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    diagramStore.setTestDiagram(TEST_ID, "burn");
    diagramStore.setProgress("get-contract", "running");

    const contract = await Tezos.wallet.at(CONTRACT_ADDRESS);

    diagramStore.setProgress("estimate-fees", "running");
    const transferParams = await contract.methodsObject
      .burn(param)
      .toTransferParams();
    estimate = await Tezos.estimate.transfer(transferParams);

    if (estimate) {
      diagramStore.setNodeButton("estimate-fees", {
        icon: PiggyBank,
        text: "View Fees",
        onClick: () => diagramStore.showFeeEstimationDialog(estimate),
      });
    }

    diagramStore.setProgress("execute-operation", "running");
    const operation = await contract.methodsObject.burn(param).send();

    diagramStore.setProgress("wait-confirmation", "running");
    const confirmation = await operation.confirmation(3);

    if (confirmation?.block.hash) {
      diagramStore.setOperationHash(confirmation?.block.hash);
    }
    diagramStore.setCompleted();
  } catch (error) {
    console.error(`Error: ${JSON.stringify(error, null, 2)}`);
    diagramStore.setErrorMessage(error);
  }
};

/**
 * Transfers tokens between addresses
 *
 * @param transfers - Array of transfer parameters (all will be processed)
 * @returns Promise<void>
 */
export const transferTokens = async (
  transfers: TransferParam[],
): Promise<void> => {
  const diagramStore = useDiagramStore();
  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    diagramStore.setTestDiagram(TEST_ID, "transfer");
    diagramStore.setProgress("get-contract", "running");

    const contract = await Tezos.wallet.at(CONTRACT_ADDRESS);

    if (transfers.length === 0) {
      throw new Error("No transfer parameters provided");
    }

    diagramStore.setProgress("estimate-fees", "running");
    const transferParams = await contract.methodsObject
      .transfer(transfers)
      .toTransferParams();
    estimate = await Tezos.estimate.transfer(transferParams);

    if (estimate) {
      diagramStore.setNodeButton("estimate-fees", {
        icon: PiggyBank,
        text: "View Fees",
        onClick: () => diagramStore.showFeeEstimationDialog(estimate),
      });
    }

    diagramStore.setProgress("execute-operation", "running");
    const operation = await contract.methodsObject.transfer(transfers).send();

    diagramStore.setProgress("wait-confirmation", "running");
    const confirmation = await operation.confirmation(3);

    if (confirmation?.block.hash) {
      diagramStore.setOperationHash(confirmation?.block.hash);
    }
    diagramStore.setCompleted();
  } catch (error) {
    console.error(`Error: ${JSON.stringify(error, null, 2)}`);
    diagramStore.setErrorMessage(error);
  }
};

/**
 * Gets token balances for specified addresses and token IDs by reading contract
 * storage directly This is a non-standard approach but is quick and doesn't use
 * the callback contract, so less complexity, time, and fees
 *
 * @param requests - Array of balance requests
 * @returns Promise<TokenBalance[]>
 */
export const getTokenBalancesDirect = async (
  requests: Array<{ owner: string; token_id: string }>,
): Promise<TokenBalance[]> => {
  const diagramStore = useDiagramStore();
  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    diagramStore.setTestDiagram(TEST_ID, "get-balance");
    diagramStore.setProgress("get-contract", "running");

    const fa2Contract = await Tezos.contract.at(CONTRACT_ADDRESS);

    diagramStore.setProgress("read-fa2-storage", "running");
    const storage = (await fa2Contract.storage()) as FA2TokenStorage;

    const balances: TokenBalance[] = [];

    for (const request of requests) {
      const tokenMetadata = await storage.token_metadata.get(request.token_id);
      if (!tokenMetadata) {
        throw new Error(`Token ID ${request.token_id} does not exist`);
      }

      const rawBalance = await storage.ledger.get([
        request.owner,
        request.token_id,
      ]);
      const balance = rawBalance ? rawBalance.toString() : "0";

      balances.push({
        owner: request.owner,
        token_id: request.token_id,
        balance: balance,
      });
    }

    diagramStore.setCompleted();
    return balances;
  } catch (error) {
    console.error(`Error: ${JSON.stringify(error, null, 2)}`);
    diagramStore.setErrorMessage(error);
    return [];
  }
};

/**
 * Gets token balances using TZIP-12 compliant balance_of callback pattern This
 * follows the FA2 standard but requires a callback contract.
 *
 * @param requests - Array of balance requests
 * @returns Promise<TokenBalance[]>
 */
export const getTokenBalancesWithCallback = async (
  requests: Array<{ owner: string; token_id: string }>,
): Promise<TokenBalance[]> => {
  const diagramStore = useDiagramStore();
  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    diagramStore.setTestDiagram(TEST_ID, "get-balance-with-callback");
    diagramStore.setProgress("get-contracts", "running");

    const fa2Contract = await Tezos.wallet.at(CONTRACT_ADDRESS);
    const callbackContract = await Tezos.wallet.at(CALLBACK_CONTRACT_ADDRESS);

    diagramStore.setProgress("call-balance-of", "running");

    const balanceOfParams = {
      requests: requests,
      callback: callbackContract.address,
    };

    const operation = await fa2Contract.methodsObject
      .balance_of(balanceOfParams)
      .send();

    diagramStore.setProgress("wait-confirmation", "running");
    const confirmation = await operation.confirmation(1);

    if (confirmation?.block.hash) {
      diagramStore.setOperationHash(confirmation?.block.hash);
    }

    diagramStore.setProgress("read-callback-storage", "running");
    const callbackStorage =
      (await callbackContract.storage()) as BalanceCallbackStorage;

    const fa2Address = fa2Contract.address;
    const responses = await callbackStorage.responses.get(fa2Address);

    if (!responses) {
      throw new Error(
        `No balance responses found for FA2 contract ${fa2Address}. This might indicate the callback wasn't processed yet or there's an authorization issue.`,
      );
    }

    const balances: TokenBalance[] = responses.data.map((response) => ({
      owner: response.request.owner,
      token_id: response.request.token_id,
      balance: response.balance,
    }));

    diagramStore.setCompleted();
    return balances;
  } catch (error) {
    console.error(`Error: ${JSON.stringify(error, null, 2)}`);
    diagramStore.setErrorMessage(error);
    return [];
  }
};
