import type { TestMetadata } from "@/modules/tests/test";
import type { ContractName, NetworkProfile } from "@/types/network";

export type TestReadinessReason =
  | "ready"
  | "unsupported-network"
  | "missing-capabilities"
  | "missing-contracts";

export interface TestReadiness {
  isReady: boolean;
  reason: TestReadinessReason;
  missingCapabilities: string[];
  missingContracts: string[];
}

export interface MissingPrerequisite {
  testId: string;
  testTitle: string;
  missingContracts: string[];
}

export const getTestReadiness = (
  test: TestMetadata,
  networkProfile: NetworkProfile | undefined,
): TestReadiness => {
  if (!networkProfile) {
    return {
      isReady: false,
      reason: "unsupported-network",
      missingCapabilities: [],
      missingContracts: [],
    };
  }

  if (
    test.supportedNetworks &&
    !test.supportedNetworks.includes(networkProfile.id)
  ) {
    return {
      isReady: false,
      reason: "unsupported-network",
      missingCapabilities: [],
      missingContracts: [],
    };
  }

  const missingCapabilities = (test.requiredCapabilities ?? []).filter(
    (capability) => !networkProfile.capabilities.includes(capability),
  );
  if (missingCapabilities.length > 0) {
    return {
      isReady: false,
      reason: "missing-capabilities",
      missingCapabilities,
      missingContracts: [],
    };
  }

  const requiredContracts = test.requiredContracts ?? [];
  if (requiredContracts.length === 0) {
    return {
      isReady: true,
      reason: "ready",
      missingCapabilities: [],
      missingContracts: [],
    };
  }

  const missingContracts = requiredContracts.filter((contractName) => {
    const contractKey = contractName as ContractName;
    return !networkProfile.contracts[contractKey]?.address;
  });

  if (missingContracts.length > 0) {
    return {
      isReady: false,
      reason: "missing-contracts",
      missingCapabilities: [],
      missingContracts,
    };
  }

  return {
    isReady: true,
    reason: "ready",
    missingCapabilities: [],
    missingContracts: [],
  };
};

export const getTestsMissingPrerequisites = (
  tests: Record<string, TestMetadata>,
  networkProfile: NetworkProfile | undefined,
): MissingPrerequisite[] =>
  Object.values(tests)
    .map((test) => ({
      testId: test.id,
      testTitle: test.title,
      readiness: getTestReadiness(test, networkProfile),
    }))
    .filter(
      ({ readiness }) =>
        readiness.reason === "missing-contracts" &&
        readiness.missingContracts.length > 0,
    )
    .map(({ testId, testTitle, readiness }) => ({
      testId,
      testTitle,
      missingContracts: readiness.missingContracts,
    }));
