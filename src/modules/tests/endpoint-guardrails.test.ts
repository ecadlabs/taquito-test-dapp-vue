import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const retiredEndpointDomain = ["ecadinfra", "com"].join(".");
const pathsToScan = [
  ".env.example",
  ".github",
  "README.md",
  "package.json",
  "playwright.config.ts",
  "public",
  "src",
  "tests",
  "vite.config.ts",
];
const ignoredDirectories = new Set(["node_modules", "dist", "test-results"]);

const collectFiles = async (path: string): Promise<string[]> => {
  const entries = await readdir(path, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const childPath = join(path, entry.name);
      if (entry.isDirectory()) {
        if (ignoredDirectories.has(entry.name)) {
          return [];
        }
        return collectFiles(childPath);
      }
      if (!entry.isFile()) {
        return [];
      }
      return [childPath];
    }),
  );

  return files.flat();
};

const collectPathFiles = async (path: string): Promise<string[]> => {
  const pathStats = await stat(path);
  if (pathStats.isDirectory()) {
    return collectFiles(path);
  }
  if (pathStats.isFile()) {
    return [path];
  }
  return [];
};

test("does not reference retired ECAD infra endpoints", async () => {
  const files = (
    await Promise.all(pathsToScan.map((path) => collectPathFiles(path)))
  ).flat();

  const matches: string[] = [];
  await Promise.all(
    files.map(async (file) => {
      const contents = await readFile(file, "utf8");
      if (contents.includes(retiredEndpointDomain)) {
        matches.push(file);
      }
    }),
  );

  assert.deepEqual(matches.sort(), []);
});

test("advertises shadownet and ushuaianet live deployments and omits retired tezlink-shadownet", async () => {
  const publicLandingFiles = [
    "README.md",
    "src/modules/home/views/HomeView.vue",
  ];

  for (const file of publicLandingFiles) {
    const contents = await readFile(file, "utf8");
    assert.equal(
      contents.includes("https://tezlink-shadownet.dapp.taquito.io"),
      false,
      `${file} should not advertise retired tezlink-shadownet deployment`,
    );
    assert.equal(
      contents.includes("https://shadownet.dapp.taquito.io/"),
      true,
      `${file} should include shadownet live deployment`,
    );
    assert.equal(
      contents.includes("https://ushuaianet.dapp.taquito.io/"),
      true,
      `${file} should include ushuaianet live deployment`,
    );
  }
});

test("github workflows use current Node 24 actions and exclude retired tezlink-shadownet from deploy matrix", async () => {
  const workflowFiles = await collectFiles(".github/workflows");
  const deprecatedActions = [
    "actions/checkout@v4",
    "actions/setup-node@v4",
    "actions/upload-artifact@v4",
    "cloudflare/wrangler-action@v3",
    "marocchino/sticky-pull-request-comment@v2",
  ];

  for (const file of workflowFiles) {
    const contents = await readFile(file, "utf8");
    for (const action of deprecatedActions) {
      assert.equal(
        contents.includes(action),
        false,
        `${file} still uses deprecated ${action}`,
      );
    }
  }

  const deployWorkflow = await readFile(".github/workflows/deploy.yml", "utf8");
  assert.equal(
    deployWorkflow.includes("environment: tezlink-shadownet"),
    false,
    "deploy.yml should not deploy to retired tezlink-shadownet",
  );
  assert.equal(
    deployWorkflow.includes("node-version: 24"),
    true,
    "deploy.yml should use Node 24 LTS",
  );
});
