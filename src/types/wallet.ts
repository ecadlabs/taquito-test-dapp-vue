type WalletProvider = "beacon" | "walletconnect" | "programmatic" | "ledger";

export type { WalletProvider };

export type Confirmation =
  | number
  | {
      block: {
        hash: string;
      };
    }
  | undefined;
