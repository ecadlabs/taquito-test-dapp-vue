import contracts from "@/contracts/contract-config.json";
import { useDiagramStore } from "@/stores/diagramStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useWalletStore } from "@/stores/walletStore";
import { type ContractConfig } from "@/types/contract";
import type { Estimate } from "@taquito/taquito";
import { toast } from "vue-sonner";

interface ContractEvent {
  opHash?: string;
  blockHash?: string;
  level?: number;
  tag?: string;
  payload?: unknown;
  timestamp?: string;
}

interface EventSubscription {
  on(type: "data", callback: (event: ContractEvent) => void): void;
  on(type: "error", callback: (error: Error) => void): void;
  on(type: "close", callback: () => void): void;
  close(): void;
}

const CONTRACT_ADDRESS =
  (contracts as ContractConfig[]).find(
    (contract: ContractConfig) => contract.contractName === "events-contract",
  )?.address ?? "";
const TEST_ID = "contract-events";

let estimate: Estimate;
let eventSubscription: EventSubscription | null = null;
let eventCallback: ((event: ContractEvent) => void) | null = null;
let isSubscribed = false;

/**
 * Sets the callback function to receive events.
 *
 * @param {function} callback - Function to call when events are received
 */
const setEventCallback = (callback: (event: ContractEvent) => void): void => {
  eventCallback = callback;
};

/**
 * Gets the current subscription status.
 *
 * @returns {boolean} True if currently subscribed, false otherwise
 */
const getSubscriptionStatus = (): boolean => {
  return isSubscribed;
};

/**
 * Subscribes to contract events.
 *
 * @async
 * @returns {Promise<void>}
 */
const subscribeToEvents = async (): Promise<void> => {
  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    const sub = Tezos.stream.subscribeEvent({
      address: CONTRACT_ADDRESS,
    }) as EventSubscription;

    sub.on("data", (event: ContractEvent) => {
      if (eventCallback) {
        eventCallback(event);
      }
    });

    sub.on("error", (error: Error) => {
      console.error("Event subscription error:", error);
    });

    eventSubscription = sub;
    isSubscribed = true;
    toast.success("Successfully subscribed to contract events");
  } catch (error) {
    console.error("Error subscribing to events:", error);
    toast.error("Failed to subscribe to events", {
      description: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Unsubscribes from contract events.
 *
 * @returns {void}
 */
const unsubscribeFromEvents = (): void => {
  if (eventSubscription) {
    eventSubscription.close();
    eventSubscription = null;
    isSubscribed = false;
    toast.success("Successfully unsubscribed from contract events");
  } else {
    toast.info("No active subscription to unsubscribe from");
  }
};

/**
 * Emits an event by calling the interact method.
 *
 * @async
 * @returns {Promise<void>}
 */
const emitEvent = async (): Promise<void> => {
  const diagramStore = useDiagramStore();
  const settingsStore = useSettingsStore();

  diagramStore.setTestDiagram(TEST_ID, "emit-event");

  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    diagramStore.setProgress("get-contract");
    const contract = await Tezos.wallet.at(CONTRACT_ADDRESS);

    const transferParams = await contract.methodsObject
      .default()
      .toTransferParams();
    estimate = await Tezos.estimate.transfer(transferParams);

    if (estimate) {
      diagramStore.setFeeEstimate(estimate);
    }

    diagramStore.setProgress("execute-operation");
    const operation = await contract.methodsObject.default().send();

    diagramStore.setProgress("wait-confirmation");
    await operation.confirmation(settingsStore.getConfirmationCount);

    diagramStore.setOperationHash(operation.opHash);
    diagramStore.setCompleted();
  } catch (error) {
    console.error("Error emitting event:", error);
    diagramStore.setErrorMessage(error);
  }
};

/**
 * Gets the contract's event schema.
 *
 * @async
 * @returns {Promise<unknown>} The event schema object
 */
const getEventSchema = async (): Promise<unknown> => {
  const walletStore = useWalletStore();
  const Tezos = walletStore.getTezos;

  try {
    const contractAbstraction = await Tezos.contract.at(CONTRACT_ADDRESS);
    return contractAbstraction.eventSchema;
  } catch (error) {
    console.error("Error getting event schema:", error);
    throw error;
  }
};

export {
  emitEvent,
  getEventSchema,
  getSubscriptionStatus,
  setEventCallback,
  subscribeToEvents,
  unsubscribeFromEvents,
};
