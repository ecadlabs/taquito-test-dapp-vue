import { TezosToolkit } from "@taquito/taquito";
import { writeFileSync, readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { config } from "dotenv";
import { importKey } from "@taquito/signer";
import type { CounterStorage } from "@/types/contract";

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
  storage: CounterStorage;
}

interface ContractDefinition {
  name: string;
  path: string;
  storage: CounterStorage;
}

export const originateContracts = async (
  key: string,
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
      contracts.push({
        name: contractName,
        path: join(compiledDir, file),
        storage: getDefaultStorage(contractName),
      });
    }
  }

  if (contracts.length === 0) {
    throw new Error(
      "No contracts found to originiate. Did you forget to compile?",
    );
  }

  console.log(`📄 Found ${contracts.length} contract(s) to originate`);

  const results: OriginationResult[] = [];

  // Originate each contract
  for (const contract of contracts) {
    try {
      console.log(`\n📄 Originating ${contract.name} contract...`);

      // Check if contract file exists
      if (!existsSync(contract.path)) {
        console.warn(
          `⚠️  Contract file not found: ${contract.path}, skipping...`,
        );
        continue;
      }

      // Read contract code
      const contractCode = readFileSync(contract.path, "utf8");
      console.log(`📖 Contract code loaded from: ${contract.path}`);

      // Originate the contract
      console.log(`⏳ Initiating origination for ${contract.name}...`);
      const originationOp = await Tezos.contract.originate({
        code: contractCode,
        storage: contract.storage,
      });

      if (!originationOp.contractAddress) {
        throw new Error("Contract address is undefined after origination");
      }

      console.log(
        `⏳ Waiting for confirmation of origination for ${originationOp.contractAddress}...`,
      );

      // Wait for confirmation
      await originationOp.contract();
      console.log(`✅ Origination completed for ${contract.name}`);
      console.log(`📍 Contract address: ${originationOp.contractAddress}`);

      // Get operation hash
      const operationHash = originationOp.hash;
      console.log(`🔗 Operation hash: ${operationHash}`);

      results.push({
        contractAddress: originationOp.contractAddress,
        contractName: contract.name,
        operationHash: operationHash,
        storage: contract.storage,
      });
    } catch (error) {
      console.error(`❌ Error originating ${contract.name} contract:`, error);
      throw error;
    }
  }

  // Save contract configuration
  if (results.length > 0) {
    const contractConfig: ContractConfig[] = results.map((result) => ({
      address: result.contractAddress,
      originatedAt: new Date().toISOString(),
      network: networkType,
      contractName: result.contractName,
    }));

    const configPath = join(
      process.cwd(),
      "src",
      "contracts",
      "contract-config.json",
    );
    writeFileSync(configPath, JSON.stringify(contractConfig, null, 2));
    console.log(`\n💾 Contract configuration saved to: ${configPath}`);
  }

  console.log(`\n🎉 All contracts originated successfully!`);
  return results;
};

// Helper function to get default storage for different contracts
function getDefaultStorage(contractName: string): CounterStorage {
  switch (contractName.toLowerCase()) {
    case "counter":
      return 0;
    default:
      return 0;
  }
}

// If running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const key = process.argv[2];

  originateContracts(key)
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
