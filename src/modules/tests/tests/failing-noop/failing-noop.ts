import { useWalletStore } from "@/stores/walletStore";
import { useDiagramStore } from "@/stores/diagramStore";
import { verifySignature } from "@taquito/utils";

const TEST_ID = "failing-noop";

/**
 * Signs a failing noop operation and verifies the signature.
 *
 * @async
 * @returns {Promise<void>} Resolves when the operation is processed or fails with an error.
 */
const failNoop = async (): Promise<void> => {
  const diagramStore = useDiagramStore();
  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  // This is a hex string of "Hello World"
  const hex = "48656C6C6F20576F726C64";

  try {
    diagramStore.setProgress("signing-operation", "running", TEST_ID);
    diagramStore.setProgress("wait-for-user", "running", TEST_ID);
    const signed = await Tezos.wallet.signFailingNoop({
      arbitrary: hex,
      basedOnBlock: 0,
    });

    diagramStore.setProgress("get-public-key", "running", TEST_ID);
    const pk = await walletStore.getWalletPublicKey();
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
