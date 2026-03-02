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
  ghostnet: {
    bridgeContract: "KT1VEjeQfDBSfpDH5WeBM5LukHPGM2htYEh3",
    exchangerContract: "KT1Bp9YUvUBJgXxf5UrYTM2CGRUPixURqx4m",
    rollupAddress: "sr18wx6ezkeRjt1SZSeZ2UQzQN3Uc3YLMLqg",
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
