import { useWalletStore } from "@/stores/walletStore";
import { useDiagramStore } from "@/stores/diagramStore";
import { PiggyBank } from "lucide-vue-next";
import type { Estimate } from "@taquito/taquito";
import { RpcClient } from "@taquito/rpc";

const TEST_ID = "staking";
let estimate: Estimate;

const stake = async (amount: number) => {
  const diagramStore = useDiagramStore();
  diagramStore.setTestDiagram(TEST_ID, "stake");
  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    diagramStore.setProgress("estimate-fees", "running", TEST_ID);
    estimate = await Tezos.estimate.stake({
      amount,
      mutez: false,
    });

    if (estimate) {
      diagramStore.setNodeButton("estimate-fees", {
        icon: PiggyBank,
        text: "View Fees",
        onClick: () => diagramStore.showFeeEstimationDialog(estimate),
      });
    }

    diagramStore.setProgress("stake", "running", TEST_ID);
    diagramStore.setProgress("wait-for-user", "running", TEST_ID);
    const op = await Tezos.wallet
      .stake({
        amount,
        mutez: false,
      })
      .send();

    diagramStore.setProgress("wait-for-chain-confirmation", "running", TEST_ID);
    const confirmation = await op.confirmation();

    if (confirmation?.block.hash)
      diagramStore.setOperationHash(confirmation?.block.hash, TEST_ID);

    diagramStore.setProgress("success", "completed", TEST_ID);
    await walletStore.fetchBalance();
  } catch (error) {
    console.error(`Failed to stake '${amount}': ${error}`);
    diagramStore.setErrorMessage(error, TEST_ID);
    throw error;
  }
};

const unstake = async (amount: number) => {
  const diagramStore = useDiagramStore();
  diagramStore.setTestDiagram(TEST_ID, "unstake");
  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    diagramStore.setProgress("estimate-fees", "running", TEST_ID);
    estimate = await Tezos.estimate.stake({
      amount,
      mutez: false,
    });

    if (estimate) {
      diagramStore.setNodeButton("estimate-fees", {
        icon: PiggyBank,
        text: "View Fees",
        onClick: () => diagramStore.showFeeEstimationDialog(estimate),
      });
    }

    diagramStore.setProgress("unstake", "running", TEST_ID);
    diagramStore.setProgress("wait-for-user", "running", TEST_ID);
    const op = await Tezos.wallet
      .unstake({
        amount,
        mutez: false,
      })
      .send();

    diagramStore.setProgress("wait-for-chain-confirmation", "running", TEST_ID);
    const confirmation = await op.confirmation();

    if (confirmation?.block.hash)
      diagramStore.setOperationHash(confirmation?.block.hash, TEST_ID);

    diagramStore.setProgress("success", "completed", TEST_ID);
    await walletStore.fetchBalance();
  } catch (error) {
    console.error(`Failed to unstake '${amount}': ${error}`);
    diagramStore.setErrorMessage(error, TEST_ID);
    throw error;
  }
};

const finalizeUnstake = async () => {
  const diagramStore = useDiagramStore();
  diagramStore.setTestDiagram(TEST_ID, "finalize-unstake");
  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    diagramStore.setProgress("estimate-fees", "running", TEST_ID);
    estimate = await Tezos.estimate.finalizeUnstake({});

    if (estimate) {
      diagramStore.setNodeButton("estimate-fees", {
        icon: PiggyBank,
        text: "View Fees",
        onClick: () => diagramStore.showFeeEstimationDialog(estimate),
      });
    }

    diagramStore.setProgress("finalize-unstake", "running", TEST_ID);
    diagramStore.setProgress("wait-for-user", "running", TEST_ID);
    const op = await Tezos.wallet.finalizeUnstake({}).send();

    diagramStore.setProgress("wait-for-chain-confirmation", "running", TEST_ID);
    const confirmation = await op.confirmation();

    if (confirmation?.block.hash)
      diagramStore.setOperationHash(confirmation?.block.hash, TEST_ID);

    diagramStore.setProgress("success", "completed", TEST_ID);
    await walletStore.fetchBalance();
  } catch (error) {
    console.error(`Failed to finalize unstake: ${error}`);
    diagramStore.setErrorMessage(error, TEST_ID);
    throw error;
  }
};

const getStakingInfo = async (address: string) => {
  const rpc = new RpcClient(import.meta.env.VITE_RPC_URL);

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

export { stake, unstake, finalizeUnstake, getStakingInfo };
