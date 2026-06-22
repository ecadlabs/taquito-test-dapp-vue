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
