import {
  BeaconEvent,
  type BeaconEventHandlerFunction,
  type BeaconEventType,
  type BeaconMessageRecord,
  type BeaconWallet,
  type PendingRequestInfo,
  type WalletInfo,
} from "@taquito/beacon-wallet";

type HandlerLists = {
  [K in BeaconEvent]: BeaconEventHandlerFunction<BeaconEventType[K]>[];
};

// Listed out so the fake stops compiling when the SDK adds or removes events.
const emptyHandlerLists = (): HandlerLists => ({
  [BeaconEvent.PERMISSION_REQUEST_SENT]: [],
  [BeaconEvent.PERMISSION_REQUEST_SUCCESS]: [],
  [BeaconEvent.PERMISSION_REQUEST_ERROR]: [],
  [BeaconEvent.PROOF_OF_EVENT_CHALLENGE_REQUEST_SENT]: [],
  [BeaconEvent.PROOF_OF_EVENT_CHALLENGE_REQUEST_SUCCESS]: [],
  [BeaconEvent.PROOF_OF_EVENT_CHALLENGE_REQUEST_ERROR]: [],
  [BeaconEvent.SIMULATED_PROOF_OF_EVENT_CHALLENGE_REQUEST_SENT]: [],
  [BeaconEvent.SIMULATED_PROOF_OF_EVENT_CHALLENGE_REQUEST_SUCCESS]: [],
  [BeaconEvent.SIMULATED_PROOF_OF_EVENT_CHALLENGE_REQUEST_ERROR]: [],
  [BeaconEvent.OPERATION_REQUEST_SENT]: [],
  [BeaconEvent.OPERATION_REQUEST_SUCCESS]: [],
  [BeaconEvent.OPERATION_REQUEST_ERROR]: [],
  [BeaconEvent.SIGN_REQUEST_SENT]: [],
  [BeaconEvent.SIGN_REQUEST_SUCCESS]: [],
  [BeaconEvent.SIGN_REQUEST_ERROR]: [],
  [BeaconEvent.BLOCKCHAIN_REQUEST_SUCCESS]: [],
  [BeaconEvent.BROADCAST_REQUEST_SENT]: [],
  [BeaconEvent.BROADCAST_REQUEST_SUCCESS]: [],
  [BeaconEvent.BROADCAST_REQUEST_ERROR]: [],
  [BeaconEvent.ACKNOWLEDGE_RECEIVED]: [],
  [BeaconEvent.WAITING_FOR_WALLET_ACK]: [],
  [BeaconEvent.LATE_RESPONSE_RECEIVED]: [],
  [BeaconEvent.LOCAL_RATE_LIMIT_REACHED]: [],
  [BeaconEvent.NO_PERMISSIONS]: [],
  [BeaconEvent.ACTIVE_ACCOUNT_SET]: [],
  [BeaconEvent.ACTIVE_TRANSPORT_SET]: [],
  [BeaconEvent.TRANSPORT_STATUS_CHANGED]: [],
  [BeaconEvent.SHOW_PREPARE]: [],
  [BeaconEvent.HIDE_UI]: [],
  [BeaconEvent.INVALID_ACTIVE_ACCOUNT_STATE]: [],
  [BeaconEvent.INVALID_ACCOUNT_DEACTIVATED]: [],
  [BeaconEvent.PAIR_INIT]: [],
  [BeaconEvent.PAIR_SUCCESS]: [],
  [BeaconEvent.CHANNEL_CLOSED]: [],
  [BeaconEvent.GENERIC_ERROR]: [],
  [BeaconEvent.RELAYER_ERROR]: [],
  [BeaconEvent.INTERNAL_ERROR]: [],
  [BeaconEvent.UNKNOWN]: [],
});

/**
 * Test double for the observable surface of `BeaconWallet`. Implements the real
 * method signatures so fakes need no casts, and counts unsubscribes so tests
 * can assert subscription cleanup.
 */
export class FakeBeaconWallet implements Pick<
  BeaconWallet,
  | "subscribeToEvent"
  | "subscribeToMessages"
  | "getPendingRequests"
  | "getWalletInfo"
> {
  readonly handlers: HandlerLists = emptyHandlerLists();
  readonly messageListeners: ((record: BeaconMessageRecord) => void)[] = [];
  pending: readonly PendingRequestInfo[] = [];
  walletInfo: WalletInfo | undefined = undefined;
  eventUnsubscribes = 0;
  messageUnsubscribes = 0;

  async subscribeToEvent<K extends BeaconEvent>(
    event: K,
    callback: BeaconEventHandlerFunction<BeaconEventType[K]>,
  ): Promise<() => void> {
    const list: BeaconEventHandlerFunction<BeaconEventType[K]>[] =
      this.handlers[event];
    list.push(callback);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      this.eventUnsubscribes += 1;
      const index = list.indexOf(callback);
      if (index >= 0) list.splice(index, 1);
    };
  }

  subscribeToMessages(
    listener: (record: BeaconMessageRecord) => void,
  ): () => void {
    this.messageListeners.push(listener);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      this.messageUnsubscribes += 1;
      const index = this.messageListeners.indexOf(listener);
      if (index >= 0) this.messageListeners.splice(index, 1);
    };
  }

  getPendingRequests(): readonly PendingRequestInfo[] {
    return this.pending;
  }

  async getWalletInfo(): Promise<WalletInfo | undefined> {
    return this.walletInfo;
  }

  subscriberCount(event: BeaconEvent): number {
    return this.handlers[event].length;
  }

  async emit<K extends BeaconEvent>(
    event: K,
    data: BeaconEventType[K],
  ): Promise<void> {
    const list: BeaconEventHandlerFunction<BeaconEventType[K]>[] =
      this.handlers[event];
    for (const callback of [...list]) {
      await callback(data);
    }
  }

  emitMessage(record: BeaconMessageRecord): void {
    for (const listener of [...this.messageListeners]) {
      listener(record);
    }
  }
}
