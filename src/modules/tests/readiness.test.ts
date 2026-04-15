import assert from "node:assert/strict";
import test from "node:test";

import type { TestMetadata } from "@/modules/tests/test";
import type {
  NetworkCapability,
  NetworkProfile,
  NetworkWalletConfig,
} from "@/types/network";

import { getTestReadiness, getTestsMissingPrerequisites } from "./readiness";

const SHADOWNET = "shadownet";
const TEZLINK_SHADOWNET = "tezlink-shadownet";

const makeTest = (
  overrides: Partial<TestMetadata> & Pick<TestMetadata, "id" | "title">,
): TestMetadata => ({
  id: overrides.id,
  title: overrides.title,
  description: overrides.description ?? "",
  category: overrides.category ?? "Test",
  setup: overrides.setup ?? [],
  relatedTests: overrides.relatedTests ?? [],
  documentation: overrides.documentation ?? {},
  supportedNetworks: overrides.supportedNetworks,
  requiredCapabilities: overrides.requiredCapabilities,
  requiredContracts: overrides.requiredContracts,
});

const makeProfile = (
  overrides: Partial<NetworkProfile> & Pick<NetworkProfile, "id">,
): NetworkProfile => ({
  id: overrides.id,
  displayName: overrides.displayName ?? overrides.id,
  kind: overrides.kind ?? "l1",
  capabilities: overrides.capabilities ?? [],
  indexers: overrides.indexers ?? {},
  wallet: overrides.wallet ?? makeWallet(overrides.displayName ?? overrides.id),
  contracts: overrides.contracts ?? {},
});

const makeWallet = (networkName: string): NetworkWalletConfig =>
  ({
    rpcEnvVar: "VITE_RPC_URL",
    appName: "Test Network",
    beacon: {
      networkType: "shadownet",
      networkName,
    },
    walletConnect: {
      networkType: "shadownet",
    },
  }) as NetworkWalletConfig;

test("marks a supported test as not ready when its required contract is missing", () => {
  const saplingTest = makeTest({
    id: "sapling",
    title: "Sapling",
    requiredContracts: ["sapling"],
  });
  const profile = makeProfile({
    id: SHADOWNET,
  });

  const readiness = getTestReadiness(saplingTest, profile);

  assert.equal(readiness.isReady, false);
  assert.equal(readiness.reason, "missing-contracts");
  assert.deepEqual(readiness.missingCapabilities, []);
  assert.deepEqual(readiness.missingContracts, ["sapling"]);
});

test("marks a supported test as ready when all required contracts exist for the current network", () => {
  const saplingTest = makeTest({
    id: "sapling",
    title: "Sapling",
    requiredContracts: ["sapling"],
  });
  const profile = makeProfile({
    id: SHADOWNET,
    contracts: {
      sapling: {
        address: "KT1-ready",
        originatedAt: "2026-04-14T00:00:00.000Z",
      },
    },
  });

  const readiness = getTestReadiness(saplingTest, profile);

  assert.equal(readiness.isReady, true);
  assert.equal(readiness.reason, "ready");
  assert.deepEqual(readiness.missingCapabilities, []);
  assert.deepEqual(readiness.missingContracts, []);
});

test("treats contracts from another network as missing for the current network", () => {
  const saplingTest = makeTest({
    id: "sapling",
    title: "Sapling",
    requiredContracts: ["sapling"],
  });
  const profile = makeProfile({
    id: SHADOWNET,
    contracts: {},
  });

  const readiness = getTestReadiness(saplingTest, profile);

  assert.equal(readiness.isReady, false);
  assert.equal(readiness.reason, "missing-contracts");
  assert.deepEqual(readiness.missingCapabilities, []);
  assert.deepEqual(readiness.missingContracts, ["sapling"]);
});

test("reports unsupported networks separately from missing contract prerequisites", () => {
  const l2OnlyTest = makeTest({
    id: "tezlink",
    title: "Tezlink",
    supportedNetworks: [TEZLINK_SHADOWNET],
    requiredContracts: ["sapling"],
  });
  const profile = makeProfile({ id: SHADOWNET });

  const readiness = getTestReadiness(l2OnlyTest, profile);

  assert.equal(readiness.isReady, false);
  assert.equal(readiness.reason, "unsupported-network");
  assert.deepEqual(readiness.missingCapabilities, []);
  assert.deepEqual(readiness.missingContracts, []);
});

test("reports missing capabilities separately from missing contracts", () => {
  const bridgeTest = makeTest({
    id: "tezlink-bridge",
    title: "Tezlink Bridge",
    requiredCapabilities: ["tezlink-bridge-l1-to-l2" as NetworkCapability],
  });
  const profile = makeProfile({
    id: TEZLINK_SHADOWNET,
    kind: "l2",
    capabilities: ["l2-wallet"],
  });

  const readiness = getTestReadiness(bridgeTest, profile);

  assert.equal(readiness.isReady, false);
  assert.equal(readiness.reason, "missing-capabilities");
  assert.deepEqual(readiness.missingCapabilities, ["tezlink-bridge-l1-to-l2"]);
  assert.deepEqual(readiness.missingContracts, []);
});

test("collects only supported tests that are blocked by missing prerequisites", () => {
  const tests = {
    transfer: makeTest({
      id: "transfer",
      title: "Transfer",
    }),
    sapling: makeTest({
      id: "sapling",
      title: "Sapling",
      requiredContracts: ["sapling"],
    }),
    tezlink: makeTest({
      id: "tezlink",
      title: "Tezlink",
      supportedNetworks: [TEZLINK_SHADOWNET],
      requiredContracts: ["sapling"],
    }),
  };
  const profile = makeProfile({ id: SHADOWNET });

  const missing = getTestsMissingPrerequisites(tests, profile);

  assert.deepEqual(missing, [
    {
      testId: "sapling",
      testTitle: "Sapling",
      missingContracts: ["sapling"],
    },
  ]);
});
