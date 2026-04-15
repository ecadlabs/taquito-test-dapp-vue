import { config } from "dotenv";

import { getTestsMissingPrerequisites } from "@/modules/tests/readiness";
import { AvailableTests } from "@/modules/tests/tests";
import {
  getFlattenedContractsForNetwork,
  getNetworkProfile,
} from "@/networks/network-registry";
import type { NetworkId } from "@/types/network";

config();

const verifyNetworkConfig = (): void => {
  const network = (process.env.VITE_NETWORK_NAME ||
    process.env.VITE_NETWORK_TYPE) as NetworkId | undefined;
  if (!network) {
    throw new Error(
      "VITE_NETWORK_NAME or VITE_NETWORK_TYPE must be set in environment variables.",
    );
  }

  const networkProfile = getNetworkProfile(network);
  if (!networkProfile) {
    throw new Error(`Unknown network profile: ${network}`);
  }

  const contracts = getFlattenedContractsForNetwork(network);
  const missing = getTestsMissingPrerequisites(AvailableTests, networkProfile);
  const supportedTests = Object.values(AvailableTests).filter((test) => {
    if (test.supportedNetworks && !test.supportedNetworks.includes(network)) {
      return false;
    }

    if (test.requiredCapabilities) {
      return test.requiredCapabilities.every((capability) =>
        networkProfile.capabilities.includes(capability),
      );
    }

    return true;
  });

  console.log(`🔎 Verifying dApp readiness for network: ${network}`);
  console.log(`📚 Supported tests on this network: ${supportedTests.length}`);
  console.log(
    `📄 Configured contracts in src/networks/network-contracts.json: ${contracts.length}`,
  );

  if (missing.length === 0) {
    console.log(
      "✅ All supported tests have the contract prerequisites they need.",
    );
    return;
  }

  console.error(
    `❌ ${missing.length} supported test(s) are missing contract prerequisites:`,
  );

  for (const item of missing) {
    console.error(
      `  - ${item.testTitle} (${item.testId}): missing ${item.missingContracts.join(", ")}`,
    );
  }

  process.exitCode = 1;
};

verifyNetworkConfig();
