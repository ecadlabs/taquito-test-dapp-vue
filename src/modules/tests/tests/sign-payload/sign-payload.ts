import { useWalletStore } from "@/stores/walletStore";
import { useDiagramStore } from "@/stores/diagramStore";
import { stringToBytes, verifySignature } from "@taquito/utils";
import { type RequestSignPayloadInput } from "@airgap/beacon-sdk";
import { SigningType } from "@airgap/beacon-types";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { WalletConnect } from "@taquito/wallet-connect";

const TEST_ID = "sign-payload";

const sign = async (input: string) => {
  const diagramStore = useDiagramStore();
  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;
  diagramStore.setTestDiagram(TEST_ID, "sign");

  try {
    diagramStore.setProgress("join-payload", "running", TEST_ID);
    const formattedInput: string = ["Tezos Signed Message:", input].join(" ");

    diagramStore.setProgress("convert-to-bytes", "running", TEST_ID);
    const bytes = stringToBytes(formattedInput);
    const bytesLength = (bytes.length / 2).toString(16);
    const addPadding = `00000000${bytesLength}`;
    const paddedBytesLength = addPadding.slice(addPadding.length - 8);
    const payloadBytes = "05" + "01" + paddedBytesLength + bytes;

    // The payload to send to the wallet
    const payload: RequestSignPayloadInput = {
      signingType: SigningType.MICHELINE,
      payload: payloadBytes,
      sourceAddress: walletStore.getAddress,
    };

    const wallet = walletStore.getWallet;

    if (!wallet) {
      throw new Error("No wallet found");
    }

    diagramStore.setProgress("request-wallet-sign", "running", TEST_ID);
    diagramStore.setProgress("wait-for-user", "running", TEST_ID);
    // Different wallets have different ways of signing payloads
    let signedPayload;
    if (wallet instanceof BeaconWallet) {
      signedPayload = await wallet.client.requestSignPayload(payload);
    } else if (wallet instanceof WalletConnect) {
      const signature = await wallet.sign(payloadBytes);
      signedPayload = { signature };
    } else {
      const signature = await Tezos.signer.sign(payloadBytes);
      signedPayload = { signature: signature.prefixSig };
    }

    const { signature } = signedPayload;

    diagramStore.setProgress("verify-signature", "running", TEST_ID);
    const publicKey = await walletStore.getWallet.getPK();
    const verified = await verifySignature(payloadBytes, publicKey, signature);
    if (!verified) {
      throw new Error("Signature verification failed");
    }

    diagramStore.setProgress("success", "completed", TEST_ID);

    return signature;
  } catch (error) {
    console.error(`Failed to sign payload: ${error}`);
    diagramStore.setErrorMessage(error, TEST_ID);
    return null;
  }
};

export { sign };
