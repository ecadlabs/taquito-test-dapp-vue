import { useWalletStore } from "@/stores/walletStore";
import { useDiagramStore } from "@/stores/diagramStore";
import { verifySignature } from "@taquito/utils";

const TEST_ID = "failing-noop";

/**
 * Interacts with the contract using custom transaction limits.
 *
 * @async
 * @param {number} storageLimit - The storage limit to set for the transaction.
 * @param {number} gasLimit - The gas limit to set for the transaction.
 * @param {number} fee - The fee (in mutez) to set for the transaction.
 * @returns {Promise<void>} Resolves when the transaction is confirmed or fails with an error.
 */
const failNoop = async (): Promise<void> => {
  const diagramStore = useDiagramStore();
  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    diagramStore.setProgress("signing-operation", "running", TEST_ID);
    diagramStore.setProgress("wait-for-user", "running", TEST_ID);
    const signed = await Tezos.wallet.signFailingNoop({
      arbitrary: "48656C6C6F20576F726C64",
      basedOnBlock: 0,
    });

    diagramStore.setProgress("get-public-key", "running", TEST_ID);
    const pk = await walletStore.getWallet?.getPK();
    if (!pk) throw new Error("No public key found");

    console.log("Signed data:", signed);

    diagramStore.setProgress("verify-signature", "running", TEST_ID);
    await verifySignature(
      signed.bytes,
      pk,
      signed.signature,
      new Uint8Array([3]),
    );

    diagramStore.setProgress("success", "completed", TEST_ID);
  } catch (error) {
    console.log(`Error: ${JSON.stringify(error, null, 2)}`);
    diagramStore.setErrorMessage(error, TEST_ID);
  }
};

export { failNoop };
