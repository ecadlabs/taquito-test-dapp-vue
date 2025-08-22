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
import type { ContractConfig } from "@/types/contract";
import contracts from "@/contracts/contract-config.json";
import type { Estimate } from "@taquito/taquito";
import { PiggyBank } from "lucide-vue-next";

const TEST_ID = "sign-payload";
let estimate: Estimate;

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
    const magicString = "tezos signed offchain message";
    const interface_ = "tzip://32";
    const characterEncoding = "0";
    const message = input;

    const magicByteHex = "80";
    const magicStringHex = stringToBytes(magicString);
    const interfaceLengthHex = num2PaddedHex(interface_.length, 8);
    const interfaceHex = stringToBytes(interface_);
    const encodingHex = num2PaddedHex(Number(characterEncoding), 8);
    const messageLengthHex = num2PaddedHex(message.length, 16);
    const messageHex = stringToBytes(message);

    const fullPayloadHex =
      magicByteHex +
      magicStringHex +
      interfaceLengthHex +
      interfaceHex +
      encodingHex +
      messageLengthHex +
      messageHex;

    // For TZIP-32, we need to wrap the payload in a Micheline structure
    // The 05 prefix indicates a Micheline expression, 01 indicates bytes
    const michelinePayload = "05" + "01" + fullPayloadHex;

    const payload = {
      signingType: SigningType.MICHELINE,
      payload: michelinePayload,
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
      const signature = await Tezos.signer.sign(payload.payload);
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

const SIGNATURE_CONTRACT_ADDRESS =
  (contracts as ContractConfig[]).find(
    (contract: ContractConfig) => contract.contractName === "signature",
  )?.address ?? "";

const verifyPayloadViaContract = async (
  payload: string,
  signature: string,
  publicKey: string,
  tzip32: boolean = false,
) => {
  const walletStore = useWalletStore();
  const diagramStore = useDiagramStore();
  const Tezos = walletStore.getTezos;
  diagramStore.setTestDiagram(TEST_ID, "verify-payload-via-contract");

  try {
    let payloadBytes: string;

    console.log(tzip32);

    if (tzip32) {
      const magicString = "tezos signed offchain message";
      const interface_ = "tzip://32";
      const characterEncoding = "0";
      const message = payload;

      diagramStore.setProgress("join-payload", "running", TEST_ID);
      diagramStore.setProgress("convert-to-bytes", "running", TEST_ID);

      // For TZIP-32 verification, we need to construct the same Micheline-wrapped payload
      // that was used for signing: "05" + "01" + fullPayloadHex
      const magicByteHex = "80";
      const magicStringHex = stringToBytes(magicString);
      const interfaceLengthHex = num2PaddedHex(interface_.length, 8);
      const interfaceHex = stringToBytes(interface_);
      const encodingHex = num2PaddedHex(Number(characterEncoding), 8);
      const messageLengthHex = num2PaddedHex(message.length, 16);
      const messageHex = stringToBytes(message);

      const fullPayloadHex =
        magicByteHex +
        magicStringHex +
        interfaceLengthHex +
        interfaceHex +
        encodingHex +
        messageLengthHex +
        messageHex;
      payloadBytes = "05" + "01" + fullPayloadHex;
    } else {
      diagramStore.setProgress("join-payload", "running", TEST_ID);
      const formattedInput: string = ["Tezos Signed Message:", payload].join(
        " ",
      );

      diagramStore.setProgress("convert-to-bytes", "running", TEST_ID);
      const bytes = stringToBytes(formattedInput);
      const bytesLength = (bytes.length / 2).toString(16);
      const addPadding = `00000000${bytesLength}`;
      const paddedBytesLength = addPadding.slice(addPadding.length - 8);
      payloadBytes = "05" + "01" + paddedBytesLength + bytes;
    }

    diagramStore.setProgress("get-contract", "running", TEST_ID);
    const contract = await Tezos.wallet.at(SIGNATURE_CONTRACT_ADDRESS);

    diagramStore.setProgress("estimate-fees", "running", TEST_ID);
    const parameter = {
      public_key: publicKey,
      signature: signature,
      payload_bytes: payloadBytes,
    };

    const transferParams = await contract.methodsObject
      .default(parameter)
      .toTransferParams();
    estimate = await Tezos.estimate.transfer(transferParams);

    if (estimate) {
      diagramStore.setNodeButton("estimate-fees", {
        icon: PiggyBank,
        text: "View Fees",
        onClick: () => diagramStore.showFeeEstimationDialog(estimate),
      });
    }

    diagramStore.setProgress("wait-for-user", "running", TEST_ID);
    const operation = await contract.methodsObject.default(parameter).send();

    diagramStore.setProgress("wait-confirmation", "running", TEST_ID);
    const confirmation = await operation.confirmation(1);
    if (confirmation?.block.hash)
      diagramStore.setOperationHash(confirmation?.block.hash, TEST_ID);
    diagramStore.setProgress("success", "completed", TEST_ID);
    return true;
  } catch (error) {
    console.error(`Failed to verify payload via contract: ${error}`);
    diagramStore.setErrorMessage(error, TEST_ID);
    return false;
  }
};

export { sign, signTzip32, verifyPayloadViaContract };
