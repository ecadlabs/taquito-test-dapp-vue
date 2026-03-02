type WalletProvider =
  | "beacon"
  | "walletconnect"
  | "programmatic"
  | "ledger"
  | "web3auth";

export interface ProgrammaticWallet {
  getPKH: () => Promise<string>;
  getPK: () => Promise<string>;
  requestPermissions: () => Promise<void>;
  disconnect: () => Promise<void>;
  client: {
    getActiveAccount: () => Promise<{ address: string }>;
    getPeers: () => Promise<{ name: string }[]>;
    disconnect: () => Promise<void>;
    clearActiveAccount: () => Promise<void>;
  };
  getAllExistingSessionKeys: () => Promise<string[]>;
  configureWithExistingSessionKey: (sessionKey: string) => Promise<void>;
}

export type { WalletProvider };

export type Confirmation =
  | number
  | {
      block: {
        hash: string;
      };
    }
  | undefined;
