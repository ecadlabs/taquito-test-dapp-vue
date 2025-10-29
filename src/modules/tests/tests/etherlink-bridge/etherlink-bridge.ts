import { getOperationHash } from "@/lib/utils";
import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import type { Estimate } from "@taquito/taquito";
import { getBridgeConfig } from "./bridge-config";

const TEST_ID = "etherlink-bridge";

/**
 * Validates an Etherlink/EVM address
 *
 * @param address - The Etherlink address to validate
 * @returns True if the address is valid (0x followed by 40 hex characters),
 *   false otherwise
 */
const isValidEtherlinkAddress = (address: string): boolean => {
  try {
    // Basic validation: 0x followed by 40 hex characters
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  } catch {
    return false;
  }
};

/**
 * Deposit XTZ from Tezos L1 to Etherlink L2
 *
 * The deposit process uses the bridge helper contract:
 *
 * 1. Call bridge contract's `deposit` entrypoint with:
 *
 *    - Tez to bridge (amount in mutez)
 *    - Etherlink Smart Rollup address
 *    - Recipient's Etherlink wallet address
 * 2. The bridge contract forwards to exchanger contract
 * 3. Exchanger creates tickets and sends to Smart Rollup inbox
 *
 * @param amount - The amount of XTZ to deposit (in tez)
 * @param etherlinkAddress - The recipient's Etherlink wallet address (0x
 *   prefixed)
 * @returns Promise that resolves when the deposit is confirmed
 * @throws Error if the Etherlink address is invalid, amount is invalid, or
 *   transaction fails
 */
const depositToEtherlink = async (
  amount: number,
  etherlinkAddress: string,
): Promise<void> => {
  const diagramStore = useDiagramStore();
  diagramStore.setTestDiagram(TEST_ID, "deposit");
  let estimate: Estimate;

  // Validate inputs
  if (!etherlinkAddress || !isValidEtherlinkAddress(etherlinkAddress)) {
    const error = new Error("Invalid Etherlink address");
    diagramStore.setErrorMessage(error);
    throw error;
  }

  if (amount <= 0) {
    const error = new Error("Amount must be greater than 0");
    diagramStore.setErrorMessage(error);
    throw error;
  }

  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  // Get bridge config for current network
  const networkType = import.meta.env.VITE_NETWORK_TYPE as string;
  const bridgeConfig = getBridgeConfig(networkType);

  if (!bridgeConfig) {
    const error = new Error(
      `Bridge not configured for network: ${networkType}. Currently only Ghostnet is supported.`,
    );
    diagramStore.setErrorMessage(error);
    throw error;
  }

  try {
    diagramStore.setProgress("get-bridge-contract");
    const bridgeContract = await Tezos.wallet.at(bridgeConfig.bridgeContract);

    // Convert Etherlink address to proper bytes format
    // The evm_address type expects bytes, which should be the hex string without 0x prefix
    diagramStore.setProgress("convert-etherlink-address");
    let addressHex = etherlinkAddress.toLowerCase();
    if (addressHex.startsWith("0x")) {
      addressHex = addressHex.slice(2);
    }

    // Validate the hex address
    if (!/^[0-9a-f]{40}$/.test(addressHex)) {
      throw new Error("Invalid Etherlink address format");
    }

    // The contract expects: { l2_address: bytes, evm_address: address }
    const depositMethod = bridgeContract.methodsObject.deposit({
      l2_address: addressHex,
      evm_address: bridgeConfig.rollupAddress,
    });

    diagramStore.setProgress("estimate-fees");
    estimate = await Tezos.estimate.transfer(
      depositMethod.toTransferParams({ amount: amount }),
    );

    if (estimate) {
      diagramStore.setFeeEstimate(estimate);
    }

    diagramStore.setProgress("send-deposit-transaction");

    const op = await depositMethod.send({ amount: amount });

    diagramStore.setProgress("wait-for-chain-confirmation");
    const confirmation = await op.confirmation();

    const opHash = getOperationHash(confirmation);
    diagramStore.setOperationHash(opHash);
    diagramStore.setCompleted();
  } catch (error) {
    console.error(`Failed to deposit to Etherlink: ${error}`);
    diagramStore.setErrorMessage(error);
    throw error;
  }
};

/**
 * Send a withdrawal transaction on Etherlink using ethers.js
 *
 * This sends the transaction directly to the Etherlink withdrawal precompile.
 *
 * @param amount - The amount of XTZ to withdraw (in tez)
 * @param tezosDestination - The destination Tezos L1 address (base58 encoded)
 * @param evmProvider - The EVM wallet provider (e.g., MetaMask)
 * @param useFastWithdrawal - Whether to use fast withdrawal (default: false)
 * @returns Promise that resolves to the transaction hash
 * @throws Error if the EVM wallet is not connected or transaction fails
 */
const sendWithdrawalTransaction = async (
  amount: number,
  tezosDestination: string,
  evmProvider: unknown,
  useFastWithdrawal = false,
): Promise<string> => {
  const diagramStore = useDiagramStore();

  const { BrowserProvider, parseEther } = await import("ethers");

  if (!evmProvider) {
    diagramStore.setErrorMessage(new Error("EVM wallet not connected"));
    throw new Error("EVM wallet not connected");
  }

  diagramStore.setProgress("create-signer");
  const provider = new BrowserProvider(evmProvider as never);
  const signer = await provider.getSigner();

  // Get bridge config for withdrawal contract address
  const networkType = import.meta.env.VITE_NETWORK_TYPE as string;
  const bridgeConfig = getBridgeConfig(networkType);

  if (!bridgeConfig) {
    diagramStore.setErrorMessage(
      new Error(`Bridge not configured for network: ${networkType}`),
    );
    throw new Error(`Bridge not configured for network: ${networkType}`);
  }

  if (useFastWithdrawal) {
    diagramStore.setProgress("get-fast-withdrawal-contract");
    // Fast withdrawal requires calling fast_withdraw_base58 function
    const fastWithdrawalAddress = "0xff00000000000000000000000000000000000001";

    // ABI for the fast withdrawal function
    const abi = [
      {
        type: "function",
        name: "fast_withdraw_base58",
        constant: false,
        payable: true,
        inputs: [
          { type: "string", name: "target" },
          { type: "string", name: "fast_withdrawal_contract" },
          { type: "bytes", name: "payload" },
        ],
      },
    ];

    const { Contract } = await import("ethers");
    const contract = new Contract(fastWithdrawalAddress, abi, signer);

    // L1 destination address as string (base58 encoded)
    const target = tezosDestination;
    // Fast withdrawal contract address (exchanger contract)
    const fastWithdrawalContract = bridgeConfig.exchangerContract;
    // Payload as bytes (empty for native XTZ)
    const payload = "0x";
    try {
      diagramStore.setProgress("call-fast-withdrawal-contract");
      const txResponse = await contract.fast_withdraw_base58(
        target,
        fastWithdrawalContract,
        payload,
        { value: parseEther(amount.toString()) },
      );

      diagramStore.setProgress("wait-for-chain-confirmation");
      await txResponse.wait();

      return txResponse.hash;
    } catch (error) {
      diagramStore.setErrorMessage(
        new Error(
          `Fast withdrawal failed: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );
      throw new Error(
        `Fast withdrawal failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  } else {
    diagramStore.setProgress("get-withdrawal-contract");
    const withdrawalContractAddress =
      "0x000000000000000000000000000000000000fffe";

    // The data field encodes the destination Tezos address
    const tx = {
      to: withdrawalContractAddress,
      value: parseEther(amount.toString()),
      data: `0x${Buffer.from(tezosDestination, "utf8").toString("hex")}`,
    };

    diagramStore.setProgress("call-withdrawal-contract");
    const txResponse = await signer.sendTransaction(tx);

    diagramStore.setProgress("wait-for-chain-confirmation");
    await txResponse.wait();

    return txResponse.hash;
  }
};

/**
 * Withdraw from Etherlink L2 to Tezos L1 using EVM wallet
 *
 * Sends the withdrawal transaction directly on Etherlink.
 *
 * @param amount - The amount of XTZ to withdraw (in tez)
 * @param tezosDestination - The destination Tezos L1 address (base58 encoded)
 * @param evmProvider - The EVM wallet provider (e.g., MetaMask)
 * @param useFastWithdrawal - Whether to use fast withdrawal (default: false)
 * @returns Promise that resolves when the withdrawal is confirmed
 * @throws Error if the Tezos destination is invalid, EVM wallet is not
 *   connected, or transaction fails
 */
const withdrawFromEtherlink = async (
  amount: number,
  tezosDestination: string,
  evmProvider: unknown,
  useFastWithdrawal = false,
): Promise<void> => {
  const diagramStore = useDiagramStore();
  diagramStore.setTestDiagram(
    TEST_ID,
    useFastWithdrawal ? "withdraw-fast" : "withdraw",
  );

  if (!tezosDestination) {
    const error = new Error("Tezos destination address is required");
    diagramStore.setErrorMessage(error);
    throw error;
  }

  if (!evmProvider) {
    const error = new Error("EVM wallet not connected");
    diagramStore.setErrorMessage(error);
    throw error;
  }

  try {
    diagramStore.setProgress("sign-etherlink-tx");

    const txHash = await sendWithdrawalTransaction(
      amount,
      tezosDestination,
      evmProvider,
      useFastWithdrawal,
    );

    console.log("Withdrawal transaction hash:", txHash);
    diagramStore.setOperationHash(txHash);
    diagramStore.setCompleted();
  } catch (error) {
    console.error("Failed to withdraw from Etherlink:", error);
    diagramStore.setErrorMessage(error);
    throw error;
  }
};

export { depositToEtherlink, isValidEtherlinkAddress, withdrawFromEtherlink };
