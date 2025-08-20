import { useWalletStore } from "@/stores/walletStore";
import { useDiagramStore } from "@/stores/diagramStore";
import { num2PaddedHex, stringToBytes, verifySignature } from "@taquito/utils";
import { type RequestSignPayloadInput } from "@airgap/beacon-sdk";
import { SigningType } from "@airgap/beacon-types";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { WalletConnect } from "@taquito/wallet-connect";
import {
  Parser,
  packDataBytes,
  type MichelsonData,
  type MichelsonType,
} from "@taquito/michel-codec";

const TEST_ID = "sign-payload";

const sign = async (
  input: string,
  alreadyBytes: boolean = false,
  noDiagram: boolean = false,
) => {
  const diagramStore = useDiagramStore();
  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;
  if (!noDiagram) {
    diagramStore.setTestDiagram(TEST_ID, "sign");
  }

  try {
    diagramStore.setProgress("join-payload", "running", TEST_ID);
    const formattedInput: string = ["Tezos Signed Message:", input].join(" ");

    diagramStore.setProgress("convert-to-bytes", "running", TEST_ID);
    const bytes = alreadyBytes ? input : stringToBytes(formattedInput);
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

    if (!noDiagram) {
      diagramStore.setProgress("success", "completed", TEST_ID);
    }

    return signature;
  } catch (error) {
    console.error(`Failed to sign payload: ${error}`);
    diagramStore.setErrorMessage(error, TEST_ID);
    return null;
  }
};

const signTzip32 = async (input: string) => {
  const diagramStore = useDiagramStore();
  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;
  diagramStore.setTestDiagram(TEST_ID, "sign-tzip32");

  try {
    const magicByte = "0x80";
    const magicString = "tezos signed offchain message";
    const interface_ = "tzip://32";
    const characterEncoding = "0";
    const message = input;

    const payloadBytes =
      stringToBytes(magicString) +
      num2PaddedHex(interface_.length, 8) +
      stringToBytes(interface_) +
      num2PaddedHex(Number(characterEncoding), 8) +
      num2PaddedHex(message.length, 16) +
      stringToBytes(message);

    const payload = {
      signingType: SigningType.RAW,
      payload: magicByte + payloadBytes,
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
      const signature = await wallet.sign(payload.payload);
      signedPayload = { signature };
    } else {
      const signature = await Tezos.signer.sign(payloadBytes);
      signedPayload = { signature: signature.prefixSig };
    }

    const { signature } = signedPayload;
    diagramStore.setProgress("success", "completed", TEST_ID);

    return signature;
  } catch (error) {
    console.error(`Failed to sign payload: ${error}`);
    diagramStore.setErrorMessage(error, TEST_ID);
    return null;
  }
};

export const signMichelsonData = async (
  data: string,
  type: string,
): Promise<string> => {
  const diagramStore = useDiagramStore();
  diagramStore.setTestDiagram(TEST_ID, "signMichelson");

  diagramStore.setProgress("parse-micheline-expression", "running", TEST_ID);
  const p = new Parser();
  const dataJSON = p.parseMichelineExpression(data);
  const typeJSON = p.parseMichelineExpression(type);

  diagramStore.setProgress("pack-data-bytes", "running", TEST_ID);
  const packed = packDataBytes(
    dataJSON as MichelsonData,
    typeJSON as MichelsonType,
  );

  const signature = await sign(packed.bytes, true, true);
  if (!signature) {
    throw new Error("Failed to sign Michelson data");
  }

  diagramStore.setProgress("success", "completed", TEST_ID);
  return signature;
};

export { sign, signTzip32 };
