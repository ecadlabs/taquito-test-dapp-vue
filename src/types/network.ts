export type NetworkId = "shadownet" | "tezlink-shadownet";

export type NetworkKind = "l1" | "l2";

export type IndexerId = "tzkt" | "tzstats";

export type BeaconNetworkType =
  | "mainnet"
  | "ghostnet"
  | "weeklynet"
  | "shadownet"
  | "seoulnet"
  | "tezlink-shadownet"
  | "custom";

export type WalletConnectNetworkType =
  | "mainnet"
  | "ghostnet"
  | "weeklynet"
  | "shadownet"
  | "tezlink_shadownet"
  | "tallinnnet"
  | "custom";

export type NetworkCapability =
  | "l1-wallet"
  | "l2-wallet"
  | "contract-fixtures"
  | "sapling"
  | "etherlink-bridge"
  | "tezlink-bridge-l1-to-l2"
  | "tezlink-bridge-l2-to-l1";

export type ContractName =
  | "balance-callback"
  | "complex-parameters"
  | "counter"
  | "events-contract"
  | "fa2-token"
  | "metadata"
  | "metadata-https"
  | "sapling"
  | "signature";

export interface DeployedContract {
  address: string;
  originatedAt: string;
}

export interface NetworkContractsConfig {
  id: NetworkId;
  contracts: Partial<Record<ContractName, DeployedContract>>;
}

export interface NetworkWalletConfig {
  rpcEnvVar: "VITE_RPC_URL" | "VITE_TEZLINK_SHADOWNET_RPC";
  appName: string;
  beacon: {
    networkType: BeaconNetworkType;
    networkName: string;
  };
  walletConnect: {
    networkType: WalletConnectNetworkType;
  };
}

export interface NetworkProfile {
  id: NetworkId;
  displayName: string;
  kind: NetworkKind;
  capabilities: NetworkCapability[];
  indexers: Partial<Record<IndexerId, string>>;
  wallet: NetworkWalletConfig;
  contracts: Partial<Record<ContractName, DeployedContract>>;
}
