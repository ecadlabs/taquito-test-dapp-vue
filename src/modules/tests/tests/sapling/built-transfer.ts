/**
 * Lifecycle of a private transfer that was built without being submitted.
 *
 * Prepared: built, not injected. It can be submitted, and a wallet refusal
 * leaves it prepared. pending: injected with a known hash, applied status not
 * seen yet. It must not be submitted again; track the hash instead. failed:
 * included, but not applied. Its notes may already be spent or its root too
 * old, so it has to be rebuilt.
 *
 * An applied transfer has spent its notes, so the page drops it.
 */

/** What a built transfer is, fixed when Build is clicked. */
export interface BuiltTransferIntent {
  readonly saplingTx: string;
  readonly amountTez: number;
  readonly contractAddress: string;
  /** Sapling address whose notes the transfer spends. */
  readonly spender: string;
  /**
   * Wallet account connected when Build was clicked, if any. The Sapling key
   * built the proof; this account did not.
   */
  readonly connectedAtBuild: string | null;
}

export type BuiltTransfer =
  | { readonly state: "prepared"; readonly intent: BuiltTransferIntent }
  | {
      readonly state: "pending";
      readonly intent: BuiltTransferIntent;
      readonly opHash: string;
      readonly trackFrom: string;
    }
  | {
      readonly state: "failed";
      readonly intent: BuiltTransferIntent;
      readonly opHash: string;
      readonly reason: string;
    };

export type PreparedTransfer = Extract<BuiltTransfer, { state: "prepared" }>;
export type PendingTransfer = Extract<BuiltTransfer, { state: "pending" }>;
export type FailedTransfer = Extract<BuiltTransfer, { state: "failed" }>;

/**
 * @param intent What was built
 * @returns A transfer ready to submit
 */
export const prepareTransfer = (
  intent: BuiltTransferIntent,
): PreparedTransfer => ({ state: "prepared", intent });

/**
 * @param transfer The transfer the wallet just injected
 * @param injected Its operation hash and the block to track it from
 * @returns The transfer, pending until its result is known
 */
export const markInjected = (
  transfer: PreparedTransfer,
  injected: { opHash: string; trackFrom: string },
): PendingTransfer => ({
  state: "pending",
  intent: transfer.intent,
  opHash: injected.opHash,
  trackFrom: injected.trackFrom,
});

/**
 * @param transfer The pending transfer whose operation did not apply
 * @param reason The operation's result status
 * @returns The failed transfer, which has to be rebuilt
 */
export const markNotApplied = (
  transfer: PendingTransfer,
  reason: string,
): FailedTransfer => ({
  state: "failed",
  intent: transfer.intent,
  opHash: transfer.opHash,
  reason,
});

/** @returns Whether the transfer can be submitted */
export const isPrepared = (
  transfer: BuiltTransfer | null,
): transfer is PreparedTransfer => transfer?.state === "prepared";

/** @returns Whether the transfer was injected and its result is unknown */
export const isPending = (
  transfer: BuiltTransfer | null,
): transfer is PendingTransfer => transfer?.state === "pending";

/**
 * A local spend from the same pool and Sapling address may use the notes a
 * built transfer spends, so it drops that transfer. Pending transfers stay:
 * they are already on their way and are tracked by hash.
 */
export const afterLocalSpend = (
  transfer: BuiltTransfer | null,
  spend: { contractAddress: string; spender: string },
): BuiltTransfer | null => {
  if (
    transfer === null ||
    transfer.intent.contractAddress !== spend.contractAddress ||
    transfer.intent.spender !== spend.spender
  ) {
    return transfer;
  }
  switch (transfer.state) {
    case "prepared":
    case "failed":
      return null;
    case "pending":
      return transfer;
  }
};
