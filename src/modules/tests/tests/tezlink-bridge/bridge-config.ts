/**
 * Bridge configuration for Tezos L1 to Tezlink bridge Contains network-specific
 * contract addresses and RPC URLs
 */

export interface BridgeConfig {
  bridgeContract: string; // Helper contract that accepts deposits
  rollupAddress: string;
}

/** Bridge configuration by network */
export const bridgeConfigs: Record<string, BridgeConfig> = {
  shadownet: {
    bridgeContract: "KT1H1tWshuo5XWE5swcE7ek8hhANN7J6iY3u",
    rollupAddress: "sr1N9XzPi4bpFzaJGymynstqu8WqurCE9eQy",
  },
};

/** Get bridge configuration for the current network */
export const getBridgeConfig = (networkType: string): BridgeConfig | null => {
  const config = bridgeConfigs[networkType.toLowerCase()];
  return config || null;
};

/** Get the tezlink rollup address for the current network */
export const getRollupAddress = (networkType: string): string | null => {
  const config = getBridgeConfig(networkType);
  return config?.rollupAddress || null;
};
