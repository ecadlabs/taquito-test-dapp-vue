import type {
  BalanceCallbackStorage,
  ComplexParametersStorage,
  ContractStorage,
  FA2TokenStorage,
  MetadataContractStorage,
} from "@/types/contract";
import { importKey } from "@taquito/signer";
import {
  MichelsonMap,
  PollingSubscribeProvider,
  TezosToolkit,
} from "@taquito/taquito";
import { stringToBytes } from "@taquito/utils";
import { config } from "dotenv";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import { join } from "path";

config();

interface ContractConfig {
  address: string;
  originatedAt: string;
  network: string;
  contractName?: string;
}

interface OriginationResult {
  contractAddress: string;
  contractName: string;
  operationHash: string;
  storage: ContractStorage;
}

interface ContractDefinition {
  name: string;
  path: string;
  storage: ContractStorage;
}

export const originateContracts = async (
  key: string,
  specificContract?: string,
): Promise<OriginationResult[]> => {
  // Validate environment variables
  const rpcUrl = process.env.VITE_RPC_URL;
  const networkType = process.env.VITE_NETWORK_TYPE;

  if (!rpcUrl || !networkType) {
    throw new Error(
      "VITE_RPC_URL and VITE_NETWORK_TYPE must be set in environment variables.",
    );
  }

  console.log(`🚀 Starting contract origination...`);
  console.log(`📡 Using RPC URL: ${rpcUrl}`);
  console.log(`🌐 Using network: ${networkType}`);

  // Initialize Tezos toolkit
  const Tezos = new TezosToolkit(rpcUrl);

  // Configure polling provider for confirmation to work
  Tezos.setStreamProvider(
    Tezos.getFactory(PollingSubscribeProvider)({
      pollingIntervalMilliseconds: 5000,
    }),
  );

  if (key) {
    await importKey(Tezos, key);
  } else {
    throw new Error("Wallet private key must be passed in as an argument.");
  }

  console.log(`✅ Signer configured successfully`);

  // Discover contracts in the compiled directory
  const compiledDir = process.cwd() + "/src/contracts/compiled";
  const contracts: ContractDefinition[] = [];

  if (existsSync(compiledDir)) {
    const files = readdirSync(compiledDir).filter((file) =>
      file.endsWith(".tz"),
    );

    for (const file of files) {
      const contractName = file.replace(".tz", "");

      // If a specific contract is requested, only include that contract
      if (specificContract && contractName !== specificContract) {
        continue;
      }

      contracts.push({
        name: contractName,
        path: join(compiledDir, file),
        storage: getDefaultStorage(contractName),
      });
    }
  }

  if (contracts.length === 0) {
    if (specificContract) {
      throw new Error(
        `Contract "${specificContract}" not found in compiled directory. Did you forget to compile it?`,
      );
    } else {
      throw new Error(
        "No contracts found to originate. Did you forget to compile?",
      );
    }
  }

  if (specificContract) {
    console.log(`📄 Found contract "${specificContract}" to originate`);
  } else {
    console.log(`📄 Found ${contracts.length} contract(s) to originate`);
  }

  const results: OriginationResult[] = [];

  const originationOrder = [
    "fa2-token",
    "balance-callback",
    // Any contracts not here will be originated in any order
  ];

  const orderedContracts = contracts.sort((a, b) => {
    const aIndex = originationOrder.indexOf(a.name);
    const bIndex = originationOrder.indexOf(b.name);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  const originatedAddresses = new Map<string, string>();

  // Originate each contract in order
  for (const contract of orderedContracts) {
    try {
      console.log(`\n📄 Originating ${contract.name} contract...`);

      // Check if contract file exists
      if (!existsSync(contract.path)) {
        console.warn(
          `⚠️  Contract file not found: ${contract.path}, skipping...`,
        );
        continue;
      }

      // Update storage for contracts that depend on others
      let contractStorage = contract.storage;
      if (contract.name === "balance-callback") {
        const fa2TokenAddress = originatedAddresses.get("fa2-token");
        if (!fa2TokenAddress) {
          console.warn(
            `⏭️  Skipping ${contract.name} because dependency "fa2-token" was not successfully originated`,
          );
          continue;
        }
        console.log(
          `🔗 Adding FA2 token address ${fa2TokenAddress} to balance-callback authorized addresses`,
        );
        contractStorage = getDefaultStorage(contract.name, { fa2TokenAddress });
      }

      // Read contract code
      const contractCode = readFileSync(contract.path, "utf8");
      console.log(`📖 Contract code loaded from: ${contract.path}`);

      // Originate the contract
      console.log(`⏳ Initiating origination for ${contract.name}...`);
      const originationOp = await Tezos.contract.originate({
        code: contractCode,
        storage: contractStorage,
        gasLimit: 20000,
        storageLimit: 5000,
      });

      if (!originationOp.contractAddress) {
        throw new Error("Contract address is undefined after origination");
      }

      console.log(`⏳ Waiting for confirmation of ${contract.name}...`);

      await originationOp.confirmation();
      const contractInstance = await originationOp.contract();
      console.log(`✅ Origination completed for ${contract.name}`);
      console.log(`📍 Contract address: ${contractInstance.address}`);

      // Store the address for dependency injection
      originatedAddresses.set(contract.name, contractInstance.address);

      // Get operation hash
      const operationHash = originationOp.hash;
      console.log(`🔗 Operation hash: ${operationHash}`);

      results.push({
        contractAddress: contractInstance.address,
        contractName: contract.name,
        operationHash: operationHash,
        storage: contractStorage,
      });
    } catch (error) {
      console.error(`❌ Error originating ${contract.name} contract:`, error);
      throw error;
    }
  }

  // Save contract configuration
  if (results.length > 0) {
    const configDir = join(process.cwd(), "src", "contracts");
    const configPath = join(configDir, "contract-config.json");

    // Ensure the directory exists
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    // Read existing config if it exists
    let existingConfig: ContractConfig[] = [];
    if (existsSync(configPath)) {
      try {
        const existingContent = readFileSync(configPath, "utf8");
        existingConfig = JSON.parse(existingContent);
      } catch (error) {
        console.warn(
          `Failed to read existing config file. Starting with a fresh config. Error:`,
          error,
        );
        existingConfig = [];
      }
    }

    // Create new entries for the originated contracts
    const newEntries: ContractConfig[] = results.map((result) => ({
      address: result.contractAddress,
      originatedAt: new Date().toISOString(),
      network: networkType,
      contractName: result.contractName,
    }));

    // If originating a specific contract, update or append to existing config
    // Otherwise, replace the entire config (originating all contracts)
    let finalConfig: ContractConfig[];
    if (specificContract) {
      finalConfig = [...existingConfig];

      // Update existing entries or add new ones
      for (const newEntry of newEntries) {
        const existingIndex = finalConfig.findIndex(
          (entry) => entry.contractName === newEntry.contractName,
        );

        if (existingIndex >= 0) {
          // Update existing contract
          finalConfig[existingIndex] = newEntry;
          console.log(
            `📝 Updated existing contract "${newEntry.contractName}" in config`,
          );
        } else {
          // Append new contract
          finalConfig.push(newEntry);
          console.log(
            `➕ Added new contract "${newEntry.contractName}" to config`,
          );
        }
      }
    } else {
      // Originating all contracts, replace entire config
      finalConfig = newEntries;
    }

    writeFileSync(configPath, JSON.stringify(finalConfig, null, 2));
    console.log(
      `\n💾 Contract configuration created or updated at: ${configPath}`,
    );
  }

  console.log(`\n🎉 All contracts originated successfully!`);
  return results;
};

// Helper function to get default storage for different contracts
function getDefaultStorage(
  contractName: string,
  dependencies?: Record<string, string>,
): ContractStorage {
  switch (contractName.toLowerCase()) {
    case "counter":
      return 0;
    case "metadata": {
      const metadataMap = new MichelsonMap<string, string>();

      metadataMap.set("", stringToBytes("tezos-storage:metadata"));
      metadataMap.set(
        "metadata",
        stringToBytes(
          JSON.stringify({
            name: "Metadata Example Contract",
            description:
              "A simple counter contract to demonstrate TZIP-16 metadata",
            version: "1.0.0",
            license: { name: "MIT" },
            authors: ["ECAD Labs"],
            homepage: "https://taquito.io",
            interfaces: ["TZIP-16"],
            views: ["hello_world", "standards"],
          }),
        ),
      );

      const metadataStorage: MetadataContractStorage = {
        metadata: metadataMap,
        counter: 0,
      };

      return metadataStorage;
    }
    case "metadata-https": {
      const metadataMap = new MichelsonMap<string, string>();

      // metadataMap.set("", stringToBytes("http://localhost:5173/contract-metadata.json"));
      metadataMap.set(
        "",
        stringToBytes(
          `https://${process.env.VITE_NETWORK_TYPE}.dapp.taquito.io/contract-metadata.json`,
        ),
      );

      const metadataStorage: MetadataContractStorage = {
        metadata: metadataMap,
        counter: 0,
      };

      return metadataStorage;
    }
    case "complex-parameters": {
      const complexStorage: ComplexParametersStorage = {
        user_records: {}, // Empty BigMap
        metadata_map: {}, // Empty Map
        complex_data: {}, // Empty Map
        authorized_users: [], // Empty Set (initialized as array for Taquito)
        last_updated: new Date().toISOString(), // Current timestamp
      };
      return complexStorage;
    }
    case "fa2-token": {
      const ledger = new MichelsonMap<[string, string], string>();
      const operators = new MichelsonMap<[string, string, string], boolean>();
      const tokenMetadata = new MichelsonMap<
        string,
        { token_id: string; token_info: MichelsonMap<string, string> }
      >();
      const totalSupply = new MichelsonMap<string, string>();

      // Initialize token 0 with metadata
      const tokenInfo = new MichelsonMap<string, string>();
      tokenInfo.set("name", stringToBytes("Test FA2 Token"));
      tokenInfo.set("symbol", stringToBytes("TAQ"));
      tokenInfo.set("decimals", stringToBytes("2"));
      tokenInfo.set(
        "description",
        stringToBytes("A test FA2 token for Taquito's test dapp"),
      );

      tokenMetadata.set("0", {
        token_id: "0",
        token_info: tokenInfo,
      });

      totalSupply.set("0", "0");

      const fa2Storage: FA2TokenStorage = {
        ledger,
        operators,
        token_metadata: tokenMetadata,
        total_supply: totalSupply,
      };

      return fa2Storage;
    }
    case "balance-callback": {
      const responses = new MichelsonMap<
        string,
        {
          data: Array<{
            request: { owner: string; token_id: string };
            balance: string;
          }>;
          last_updated: string;
        }
      >();
      const authorizedAddresses = dependencies?.fa2TokenAddress
        ? [dependencies.fa2TokenAddress]
        : [];
      const callbackStorage: BalanceCallbackStorage = {
        responses,
        authorized_addresses: authorizedAddresses,
      };
      return callbackStorage;
    }
    case "sapling":
      // Sapling state must be initialized as empty object
      return {};
    default:
      return 0;
  }
}

// If running this script directly
if (process.argv[1] && process.argv[1].includes("originate-contracts")) {
  const key = process.argv[2];
  const specificContract = process.argv[3];

  if (!key) {
    console.error("Error: Private key is required as the first argument");
    console.log(
      "Usage: npm run originate-contracts <private-key> [contract-name]",
    );
    console.log("Example: npm run originate-contracts edsk... counter");
    process.exit(1);
  }

  originateContracts(key, specificContract)
    .then((results) => {
      console.log(`\n📋 Origination Summary:`);
      results.forEach((result) => {
        console.log(`  - ${result.contractName}: ${result.contractAddress}`);
      });
      process.exit(0);
    })
    .catch((error) => {
      console.error(`\n💥 Failed to originate contracts:`, error);
      process.exit(1);
    });
}
