type WalletProvider = "beacon" | "walletconnect" | "programmatic";

export type { WalletProvider };

export type Confirmation =
  | number
  | {
      block: {
        hash: string;
      };
    }
  | undefined;
