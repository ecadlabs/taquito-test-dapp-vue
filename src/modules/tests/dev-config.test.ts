import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  checkReownProjectId,
  getDevNotices,
  readReownProjectId,
} from "@/lib/devConfig";

const PROJECT_ID = "0123456789abcdef0123456789abcdef";

test("readReownProjectId treats unset and blank values as missing", () => {
  assert.equal(readReownProjectId(undefined), undefined);
  assert.equal(readReownProjectId(""), undefined);
  assert.equal(readReownProjectId("   "), undefined);
  assert.equal(readReownProjectId(` ${PROJECT_ID} `), PROJECT_ID);
});

test("checkReownProjectId fails a deploy build without a project ID", () => {
  for (const value of [undefined, "", "  "]) {
    const result = checkReownProjectId(value);
    assert.equal(result.ok, false);
    assert.match(result.message, /VITE_REOWN_PROJECT_ID/);
    assert.match(result.message, /demo/i);
  }
});

test("checkReownProjectId passes with a project ID and does not print it", () => {
  const result = checkReownProjectId(PROJECT_ID);
  assert.equal(result.ok, true);
  assert.doesNotMatch(result.message, new RegExp(PROJECT_ID));
});

test("the dev banner warns when WalletConnect runs on Beacon's demo project ID", () => {
  const notices = getDevNotices({
    dev: true,
    kukaiUrlOverride: undefined,
    reownProjectId: undefined,
  });

  assert.deepEqual(
    notices.map((notice) => notice.id),
    ["reown-demo-project-id"],
  );
  assert.match(notices[0].text, /VITE_REOWN_PROJECT_ID/);
});

test("the dev banner shows the Kukai override target", () => {
  const notices = getDevNotices({
    dev: true,
    kukaiUrlOverride: "https://kukai.example/account/tz1abc",
    reownProjectId: PROJECT_ID,
  });

  assert.deepEqual(
    notices.map((notice) => notice.id),
    ["kukai-url-override"],
  );
  assert.match(notices[0].text, /https:\/\/kukai\.example\/account\/tz1abc/);
});

test("the dev banner shows nothing in production builds or when configured", () => {
  assert.deepEqual(
    getDevNotices({
      dev: false,
      kukaiUrlOverride: undefined,
      reownProjectId: undefined,
    }),
    [],
  );
  assert.deepEqual(
    getDevNotices({
      dev: true,
      kukaiUrlOverride: undefined,
      reownProjectId: PROJECT_ID,
    }),
    [],
  );
});

test("build:verified checks the Reown project ID", async () => {
  const [packageJson, verifyScript] = await Promise.all([
    readFile("package.json", "utf8"),
    readFile("src/scripts/verify-network-config.ts", "utf8"),
  ]);

  assert.match(packageJson, /"build:verified": "npm run verify-network && /);
  assert.match(
    verifyScript,
    /checkReownProjectId\(\s*process\.env\.VITE_REOWN_PROJECT_ID\s*\)/,
  );
});
