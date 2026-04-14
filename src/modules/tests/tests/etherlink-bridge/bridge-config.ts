/**
 * Bridge configuration for Tezos L1 to Etherlink bridge Contains
 * network-specific contract addresses and RPC URLs
 *
 * Based on official Etherlink documentation:
 * https://docs.etherlink.com/bridging/bridging-tezos/
 */

export interface BridgeConfig {
  bridgeContract: string; // Helper contract that accepts deposits
  exchangerContract: string; // Stores tokens and issues tickets
  rollupAddress: string;
}

/** Bridge configuration by network */
export const bridgeConfigs: Record<string, BridgeConfig> = {
  shadownet: {
    bridgeContract: "KT19aBsSWvWtvEkbiqReJnD8UzQMWcD8SHUD",
    exchangerContract: "KT1JYZsawXmeArts18nn4uT79tUJc4AGTYgc",
    rollupAddress: "sr1N9XzPi4bpFzaJGymynstqu8WqurCE9eQy",
  },
};

/** Get bridge configuration for the current network */
export const getBridgeConfig = (networkType: string): BridgeConfig | null => {
  const config = bridgeConfigs[networkType.toLowerCase()];
  return config || null;
};

/** Get the etherlink rollup address for the current network */
export const getRollupAddress = (networkType: string): string | null => {
  const config = getBridgeConfig(networkType);
  return config?.rollupAddress || null;
};
