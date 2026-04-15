import networkContracts from "@/networks/network-contracts.json";
import type {
  BeaconNetworkType,
  ContractName,
  NetworkContractsConfig,
  NetworkId,
  NetworkProfile,
  WalletConnectNetworkType,
} from "@/types/network";

const networkDefinitions: Omit<NetworkProfile, "contracts">[] = [
  {
    id: "shadownet",
    displayName: "Shadownet",
    kind: "l1",
    indexers: {
      tzkt: "https://shadownet.tzkt.io",
    },
    wallet: {
      rpcEnvVar: "VITE_RPC_URL",
      appName: "Taquito Playground",
      beacon: {
        networkType: "shadownet" as BeaconNetworkType,
        networkName: "shadownet",
      },
      walletConnect: {
        networkType: "shadownet" as WalletConnectNetworkType,
      },
    },
    capabilities: [
      "l1-wallet",
      "contract-fixtures",
      "sapling",
      "etherlink-bridge",
      "tezlink-bridge-l1-to-l2",
    ],
  },
  {
    id: "tezlink-shadownet",
    displayName: "Tezlink Shadownet",
    kind: "l2",
    indexers: {
      tzkt: "https://shadownet.tezlink.tzkt.io",
    },
    wallet: {
      rpcEnvVar: "VITE_TEZLINK_SHADOWNET_RPC",
      appName: "Taquito Playground (Tezlink)",
      beacon: {
        networkType: "custom" as BeaconNetworkType,
        networkName: "Tezlink",
      },
      walletConnect: {
        networkType: "tezlink_shadownet" as WalletConnectNetworkType,
      },
    },
    capabilities: ["l2-wallet", "contract-fixtures", "tezlink-bridge-l2-to-l1"],
  },
];

const contractConfigs = networkContracts as NetworkContractsConfig[];

export const networkProfiles: NetworkProfile[] = networkDefinitions.map(
  (definition) => ({
    ...definition,
    contracts:
      contractConfigs.find((config) => config.id === definition.id)
        ?.contracts ?? {},
  }),
);

export const getNetworkProfile = (
  networkId: string | undefined,
): NetworkProfile | undefined =>
  networkProfiles.find((profile) => profile.id === networkId);

export const getIndexerBaseUrl = (
  networkId: string | undefined,
  indexerId: string,
): string | undefined =>
  getNetworkProfile(networkId)?.indexers[
    indexerId as keyof NetworkProfile["indexers"]
  ];

export const getWalletConfig = (networkId: string | undefined) =>
  getNetworkProfile(networkId)?.wallet;

export const getContractAddress = (
  contractName: ContractName,
  networkId: string | undefined,
): string | undefined =>
  getNetworkProfile(networkId)?.contracts[contractName]?.address;

export const getContractsForNetwork = (
  networkId: string | undefined,
): Partial<NetworkProfile["contracts"]> =>
  getNetworkProfile(networkId)?.contracts ?? {};

export const getFlattenedContractsForNetwork = (
  networkId: string | undefined,
): Array<{
  address: string;
  originatedAt: string;
  contractName: ContractName;
  network: NetworkId;
}> => {
  const profile = getNetworkProfile(networkId);
  if (!profile) {
    return [];
  }

  return Object.entries(profile.contracts).flatMap(
    ([contractName, contract]) =>
      contract
        ? [
            {
              address: contract.address,
              originatedAt: contract.originatedAt,
              contractName: contractName as ContractName,
              network: profile.id,
            },
          ]
        : [],
  );
};
