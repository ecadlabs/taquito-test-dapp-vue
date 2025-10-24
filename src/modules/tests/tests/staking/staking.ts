import { useDiagramStore } from "@/stores/diagramStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useWalletStore } from "@/stores/walletStore";
import { RpcClient } from "@taquito/rpc";
import type { Estimate } from "@taquito/taquito";

const TEST_ID = "staking";
let estimate: Estimate;

const stake = async (amount: number) => {
  const diagramStore = useDiagramStore();
  diagramStore.setTestDiagram(TEST_ID, "stake");
  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    estimate = await Tezos.estimate.stake({
      amount,
      mutez: false,
    });

    if (estimate) {
      diagramStore.setFeeEstimate(estimate);
    }

    diagramStore.setProgress("stake");
    diagramStore.setProgress("wait-for-user");
    const op = await Tezos.wallet
      .stake({
        amount,
        mutez: false,
      })
      .send();

    diagramStore.setProgress("wait-for-chain-confirmation");
    const confirmation = await op.confirmation();

    if (confirmation?.block.hash)
      diagramStore.setOperationHash(confirmation?.block.hash);

    diagramStore.setCompleted();
  } catch (error) {
    console.error(`Failed to stake '${amount}': ${error}`);
    diagramStore.setErrorMessage(error);
    throw error;
  }
};

const unstake = async (amount: number) => {
  const diagramStore = useDiagramStore();
  diagramStore.setTestDiagram(TEST_ID, "unstake");
  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    estimate = await Tezos.estimate.unstake({
      amount,
      mutez: false,
    });

    if (estimate) {
      diagramStore.setFeeEstimate(estimate);
    }

    diagramStore.setProgress("unstake");
    diagramStore.setProgress("wait-for-user");
    const op = await Tezos.wallet
      .unstake({
        amount,
        mutez: false,
      })
      .send();

    diagramStore.setProgress("wait-for-chain-confirmation");
    const confirmation = await op.confirmation();

    if (confirmation?.block.hash)
      diagramStore.setOperationHash(confirmation?.block.hash);

    diagramStore.setCompleted();
  } catch (error) {
    console.error(`Failed to unstake '${amount}': ${error}`);
    diagramStore.setErrorMessage(error);
    throw error;
  }
};

const finalizeUnstake = async () => {
  const diagramStore = useDiagramStore();
  diagramStore.setTestDiagram(TEST_ID, "finalize-unstake");
  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    estimate = await Tezos.estimate.finalizeUnstake({});

    if (estimate) {
      diagramStore.setFeeEstimate(estimate);
    }

    diagramStore.setProgress("finalize-unstake");
    diagramStore.setProgress("wait-for-user");
    const op = await Tezos.wallet.finalizeUnstake({}).send();

    diagramStore.setProgress("wait-for-chain-confirmation");
    const confirmation = await op.confirmation();

    if (confirmation?.block.hash)
      diagramStore.setOperationHash(confirmation?.block.hash);

    diagramStore.setCompleted();
  } catch (error) {
    console.error(`Failed to finalize unstake: ${error}`);
    diagramStore.setErrorMessage(error);
    throw error;
  }
};

const getStakingInfo = async (address: string) => {
  const settingsStore = useSettingsStore();
  const rpc = new RpcClient(settingsStore.settings.rpcUrl);

  try {
    const staked = await rpc.getStakedBalance(address);
    const stakedBalance =
      typeof staked === "object" && "toNumber" in staked
        ? staked.toNumber()
        : staked;

    const totalBalance = (await rpc.getBalance(address)).toNumber() / 1000000;
    return { stakedBalance, totalBalance };
  } catch (error) {
    console.error(`Failed to get staking info for ${address}: ${error}`);
    throw error;
  }
};

type StakingLimit = {
  limit_of_staking_over_baking_millionth: number;
  edge_of_baking_over_staking_billionth: number;
};

const getDelegateAcceptsStaking = async (address: string): Promise<boolean> => {
  const settingsStore = useSettingsStore();
  try {
    const rpcUrl = settingsStore.settings.rpcUrl;
    const response = await fetch(
      `${rpcUrl}/chains/main/blocks/head/context/delegates/${address}/active_staking_parameters`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const stakingData = (await response.json()) as StakingLimit;

    const { limit_of_staking_over_baking_millionth } = stakingData;
    return limit_of_staking_over_baking_millionth > 0;
  } catch (error) {
    console.error("Failed to get staking parameters:", error);
    throw error;
  }
};

export {
  finalizeUnstake,
  getDelegateAcceptsStaking,
  getStakingInfo,
  stake,
  unstake,
};
