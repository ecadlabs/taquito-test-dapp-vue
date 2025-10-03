import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import { verifySignature } from "@taquito/utils";

/**
 * Signs a failing noop operation and verifies the signature.
 *
 * @async
 * @returns {Promise<void>} Resolves when the operation is processed or fails
 *   with an error.
 */
const failNoop = async (): Promise<void> => {
  const diagramStore = useDiagramStore();
  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  // This is a hex string of "Hello World"
  const hex = "48656C6C6F20576F726C64";

  try {
    diagramStore.setProgress("signing-operation");
    diagramStore.setProgress("wait-for-user");
    const signed = await Tezos.wallet.signFailingNoop({
      arbitrary: hex,
      basedOnBlock: "head",
    });

    diagramStore.setProgress("get-public-key");
    const pk = await walletStore.getWalletPublicKey();
    if (!pk) throw new Error("No public key found");

    diagramStore.setProgress("verify-signature");
    await verifySignature(
      signed.bytes,
      pk,
      signed.signature,
      new Uint8Array([3]),
    );

    diagramStore.setCompleted();
  } catch (error) {
    console.log(`Error: ${JSON.stringify(error, null, 2)}`);
    diagramStore.setErrorMessage(error);
  }
};

export { failNoop };
