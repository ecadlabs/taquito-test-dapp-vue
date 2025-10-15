import { useTaquitoModules } from "@/composables/useTaquitoModules";
import contracts from "@/contracts/contract-config.json";
import { useDiagramStore } from "@/stores/diagramStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useWalletStore } from "@/stores/walletStore";
import type { ContractConfig } from "@/types/contract";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { LedgerSigner } from "@taquito/ledger-signer";
import type { MichelsonData, MichelsonType } from "@taquito/michel-codec";
import type { Estimate } from "@taquito/taquito";
import { WalletConnect } from "@taquito/wallet-connect";
import { PiggyBankIcon } from "lucide-vue-next";

const TEST_ID = "sign-payload";
let estimate: Estimate;

const sign = async (
  input: string,
  alreadyBytes: boolean = false,
  noDiagram: boolean = false,
) => {
  const diagramStore = useDiagramStore();
  const walletStore = useWalletStore();
  const { loadUtils, loadBeaconTypes } = useTaquitoModules();
  const Tezos = walletStore.getTezos;

  if (!noDiagram) {
    diagramStore.setTestDiagram(TEST_ID, "sign");
  }

  try {
    // Load required modules dynamically
    const [utils, beaconTypes] = await Promise.all([
      loadUtils(),
      loadBeaconTypes(),
    ]);

    diagramStore.setProgress("join-payload");
    const formattedInput: string = ["Tezos Signed Message:", input].join(" ");

    diagramStore.setProgress("convert-to-bytes");
    const bytes = alreadyBytes ? input : utils.stringToBytes(formattedInput);
    const bytesLength = (bytes.length / 2).toString(16);
    const addPadding = `00000000${bytesLength}`;
    const paddedBytesLength = addPadding.slice(addPadding.length - 8);
    const payloadBytes = "05" + "01" + paddedBytesLength + bytes;

    // The payload to send to the wallet
    const payload = {
      signingType: beaconTypes.SigningType.MICHELINE,
      payload: payloadBytes,
      sourceAddress: walletStore.getAddress,
    };

    const wallet = walletStore.getWallet;

    if (!wallet) {
      throw new Error("No wallet found");
    }

    diagramStore.setProgress("request-wallet-sign");
    diagramStore.setProgress("wait-for-user");

    // Dynamic wallet type checking and signing
    let signedPayload: { signature: string };

    if (wallet instanceof BeaconWallet) {
      signedPayload = await wallet.client.requestSignPayload(payload);
    } else if (wallet instanceof WalletConnect) {
      const signature = await wallet.sign(payloadBytes);
      signedPayload = { signature };
    } else if (wallet instanceof LedgerSigner) {
      const signature = await Tezos.signer.sign(payloadBytes);
      signedPayload = { signature: signature.prefixSig };
    } else {
      // Programmatic wallet
      const signature = await Tezos.signer.sign(payloadBytes);
      signedPayload = { signature: signature.prefixSig };
    }

    const { signature } = signedPayload;

    diagramStore.setProgress("verify-signature");
    const publicKey = await walletStore.getWalletPublicKey();
    if (!publicKey) {
      throw new Error("No public key found");
    }

    const verified = await utils.verifySignature(
      payloadBytes,
      publicKey,
      signature,
    );
    if (!verified) {
      throw new Error("Signature verification failed");
    }

    if (!noDiagram) {
      diagramStore.setCompleted();
    }

    return signature;
  } catch (error) {
    console.error(`Failed to sign payload: ${error}`);
    diagramStore.setErrorMessage(error);
    return null;
  }
};

const signTzip32 = async (input: string) => {
  const diagramStore = useDiagramStore();
  const walletStore = useWalletStore();
  const { loadUtils, loadBeaconTypes } = useTaquitoModules();
  const Tezos = walletStore.getTezos;
  diagramStore.setTestDiagram(TEST_ID, "sign-tzip32");

  try {
    // Load required modules dynamically
    const [utils, beaconTypes] = await Promise.all([
      loadUtils(),
      loadBeaconTypes(),
    ]);

    const magicString = "tezos signed offchain message";
    const interface_ = "tzip://32";
    const characterEncoding = "0";
    const message = input;

    const magicByteHex = "80";
    const magicStringHex = utils.stringToBytes(magicString);
    const interfaceLengthHex = utils.num2PaddedHex(interface_.length, 8);
    const interfaceHex = utils.stringToBytes(interface_);
    const encodingHex = utils.num2PaddedHex(Number(characterEncoding), 8);
    const messageLengthHex = utils.num2PaddedHex(message.length, 16);
    const messageHex = utils.stringToBytes(message);

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
      signingType: beaconTypes.SigningType.MICHELINE,
      payload: michelinePayload,
    };

    const wallet = walletStore.getWallet;

    if (!wallet) {
      throw new Error("No wallet found");
    }

    diagramStore.setProgress("request-wallet-sign");
    diagramStore.setProgress("wait-for-user");

    // Dynamic wallet type checking and signing
    let signedPayload: { signature: string };

    if (wallet instanceof BeaconWallet) {
      signedPayload = await wallet.client.requestSignPayload(payload);
    } else if (wallet instanceof WalletConnect) {
      const signature = await wallet.sign(payload.payload);
      signedPayload = { signature };
    } else if (wallet instanceof LedgerSigner) {
      const signature = await Tezos.signer.sign(payload.payload);
      signedPayload = { signature: signature.prefixSig };
    } else {
      // Programmatic wallet
      const signature = await Tezos.signer.sign(payload.payload);
      signedPayload = { signature: signature.prefixSig };
    }

    const { signature } = signedPayload;
    diagramStore.setCompleted();

    return signature;
  } catch (error) {
    console.error(`Failed to sign payload: ${error}`);
    diagramStore.setErrorMessage(error);
    return null;
  }
};

export const signMichelsonData = async (
  data: string,
  type: string,
): Promise<string> => {
  const diagramStore = useDiagramStore();
  const { loadMichelCodec } = useTaquitoModules();
  diagramStore.setTestDiagram(TEST_ID, "signMichelson");

  // Load michel-codec only when needed for Michelson signing
  const michelCodec = await loadMichelCodec();

  diagramStore.setProgress("parse-micheline-expression");
  const p = new michelCodec.Parser();
  const dataJSON = p.parseMichelineExpression(data);
  const typeJSON = p.parseMichelineExpression(type);

  if (!dataJSON || !typeJSON) {
    throw new Error("Failed to parse Micheline expression");
  }

  diagramStore.setProgress("pack-data-bytes");
  // Type assertion is necessary here because parseMichelineExpression returns Expr
  // but packDataBytes expects more specific Micheline types. This is safe since we're parsing valid Micheline.
  const packed = michelCodec.packDataBytes(
    dataJSON as MichelsonData,
    typeJSON as MichelsonType,
  );

  const signature = await sign(packed.bytes, true, true);
  if (!signature) {
    throw new Error("Failed to sign Michelson data");
  }

  diagramStore.setCompleted();
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
  const { loadUtils } = useTaquitoModules();
  const Tezos = walletStore.getTezos;
  diagramStore.setTestDiagram(TEST_ID, "verify-payload-via-contract");

  try {
    // Load utils for payload construction
    const utils = await loadUtils();
    let payloadBytes: string;

    if (tzip32) {
      const magicString = "tezos signed offchain message";
      const interface_ = "tzip://32";
      const characterEncoding = "0";
      const message = payload;

      diagramStore.setProgress("join-payload");
      diagramStore.setProgress("convert-to-bytes");

      // For TZIP-32 verification, we need to construct the same Micheline-wrapped payload
      // that was used for signing: "05" + "01" + fullPayloadHex
      const magicByteHex = "80";
      const magicStringHex = utils.stringToBytes(magicString);
      const interfaceLengthHex = utils.num2PaddedHex(interface_.length, 8);
      const interfaceHex = utils.stringToBytes(interface_);
      const encodingHex = utils.num2PaddedHex(Number(characterEncoding), 8);
      const messageLengthHex = utils.num2PaddedHex(message.length, 16);
      const messageHex = utils.stringToBytes(message);

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
      diagramStore.setProgress("join-payload");
      const formattedInput: string = ["Tezos Signed Message:", payload].join(
        " ",
      );

      diagramStore.setProgress("convert-to-bytes");
      const bytes = utils.stringToBytes(formattedInput);
      const bytesLength = (bytes.length / 2).toString(16);
      const addPadding = `00000000${bytesLength}`;
      const paddedBytesLength = addPadding.slice(addPadding.length - 8);
      payloadBytes = "05" + "01" + paddedBytesLength + bytes;
    }

    diagramStore.setProgress("get-contract");
    const contract = await Tezos.wallet.at(SIGNATURE_CONTRACT_ADDRESS);

    diagramStore.setProgress("estimate-fees");
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
      // Load icon only when needed
      diagramStore.setNodeButton("estimate-fees", {
        icon: PiggyBankIcon,
        text: "View Fees",
        onClick: () => diagramStore.showFeeEstimationDialog(estimate),
      });
    }

    diagramStore.setProgress("wait-for-user");
    const operation = await contract.methodsObject.default(parameter).send();

    diagramStore.setProgress("wait-confirmation");
    const settingsStore = useSettingsStore();
    const confirmation = await operation.confirmation(
      settingsStore.getConfirmationCount,
    );
    if (confirmation?.block.hash)
      diagramStore.setOperationHash(confirmation?.block.hash);
    diagramStore.setCompleted();
    return true;
  } catch (error) {
    console.error(`Failed to verify payload via contract: ${error}`);
    diagramStore.setErrorMessage(error);
    return false;
  }
};

export { sign, signTzip32, verifyPayloadViaContract };
