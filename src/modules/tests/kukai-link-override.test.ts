import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  BEACON_UI_MODULE,
  kukaiLinkOverride,
  kukaiOverrideConfig,
  loadBeaconUiModule,
  parseKukaiUrlOverride,
  rewriteKukaiLinks,
  transformBeaconUi,
} from "../../../vite-plugins/kukai-link-override";

const TARGET = "https://dev-kukai.trycloudflare.com/account/tz1abc";

// The shapes Kukai takes in @ecadlabs/beacon-ui's bundled wallet list.
const BEACON_UI_SNIPPET = [
  'links:{mainnet:"https://wallet.kukai.app",ghostnet:"https://ghostnet.kukai.app",',
  '"tezlink-shadownet":"https://shadownet-tezlink.kukai.app"}',
  'universalLink:"https://wallet.kukai.app",deepLink:"kukai://"',
  'url:"https://ios.kukai.app"',
  'temple:"https://templewallet.com",label:"Kukai",note:"kukai.app"',
].join(",");

test("parseKukaiUrlOverride treats an unset or blank value as no override", () => {
  assert.equal(parseKukaiUrlOverride(undefined), undefined);
  assert.equal(parseKukaiUrlOverride(""), undefined);
  assert.equal(parseKukaiUrlOverride("   "), undefined);
});

test("parseKukaiUrlOverride accepts https anywhere and http only on localhost", () => {
  assert.equal(parseKukaiUrlOverride(TARGET), TARGET);
  // Beacon appends "/wc?uri=...", so a trailing slash would produce "//wc".
  assert.equal(parseKukaiUrlOverride(`${TARGET}/`), TARGET);
  assert.equal(
    parseKukaiUrlOverride("http://localhost:4200/account/tz1abc"),
    "http://localhost:4200/account/tz1abc",
  );
  assert.equal(
    parseKukaiUrlOverride("http://127.0.0.1:4200"),
    "http://127.0.0.1:4200",
  );
});

test("parseKukaiUrlOverride rejects values Beacon cannot append a path to", () => {
  for (const value of [
    "http://example.com",
    "kukai://",
    "javascript:alert(1)",
    "not a url",
    `${TARGET}?network=shadownet`,
    `${TARGET}#settings`,
  ]) {
    assert.throws(
      () => parseKukaiUrlOverride(value),
      /KUKAI_URL_OVERRIDE/,
      `expected ${value} to be rejected`,
    );
  }
});

test("rewriteKukaiLinks points every Kukai web, deep, and iOS link at the target", () => {
  const rewritten = rewriteKukaiLinks(BEACON_UI_SNIPPET, TARGET);

  assert.doesNotMatch(rewritten, /https:\/\/([a-z0-9-]+\.)?kukai\.app/);
  assert.doesNotMatch(rewritten, /kukai:\/\//);
  assert.equal(rewritten.split(TARGET).length - 1, 6);
  assert.match(rewritten, /temple:"https:\/\/templewallet\.com"/);
  assert.match(rewritten, /label:"Kukai",note:"kukai\.app"/);
});

test("BEACON_UI_MODULE matches beacon-ui's bundled files on any platform", () => {
  assert.match(
    "/repo/node_modules/@ecadlabs/beacon-ui/dist/esm/index.js",
    BEACON_UI_MODULE,
  );
  assert.match(
    "C:\\repo\\node_modules\\@ecadlabs\\beacon-ui\\dist\\cjs\\index.js",
    BEACON_UI_MODULE,
  );
  assert.doesNotMatch(
    "/repo/node_modules/@ecadlabs/beacon-dapp/dist/esm/index.js",
    BEACON_UI_MODULE,
  );
});

test("loadBeaconUiModule returns the file with its Kukai links rewritten", async () => {
  const dir = await mkdtemp(join(tmpdir(), "kukai-override-"));
  const path = join(dir, "index.js");
  await writeFile(path, BEACON_UI_SNIPPET);

  const loaded = await loadBeaconUiModule(path, TARGET);

  assert.equal(loaded.loader, "js");
  assert.equal(loaded.contents, rewriteKukaiLinks(BEACON_UI_SNIPPET, TARGET));
  assert.equal(
    await readFile(path, "utf8"),
    BEACON_UI_SNIPPET,
    "on-disk file untouched",
  );
});

test("kukaiLinkOverride adds no plugin when no override is set", () => {
  assert.equal(kukaiLinkOverride(undefined), undefined);
  assert.equal(kukaiLinkOverride(""), undefined);
});

test("kukaiLinkOverride only runs under the dev server", () => {
  const plugin = kukaiLinkOverride(TARGET);
  assert.ok(plugin);
  assert.equal(plugin.apply, "serve");
});

test("kukaiOverrideConfig rewrites pre-bundled beacon-ui and tells the page about the override", () => {
  const config = kukaiOverrideConfig(TARGET);

  assert.deepEqual(config.define, {
    "import.meta.env.KUKAI_URL_OVERRIDE": JSON.stringify(TARGET),
  });
  const plugins = config.optimizeDeps?.esbuildOptions?.plugins ?? [];
  assert.equal(plugins.length, 1);
  // Vite hashes esbuild plugin names into its dependency cache key, so a new
  // target re-bundles beacon-ui without --force.
  assert.match(
    plugins[0].name,
    /dev-kukai\.trycloudflare\.com\/account\/tz1abc/,
  );
});

test("transformBeaconUi rewrites beacon-ui when Vite serves it without pre-bundling", () => {
  assert.equal(
    transformBeaconUi(
      BEACON_UI_SNIPPET,
      "/repo/node_modules/@ecadlabs/beacon-ui/dist/esm/index.js",
      TARGET,
    ),
    rewriteKukaiLinks(BEACON_UI_SNIPPET, TARGET),
  );
  assert.equal(
    transformBeaconUi(BEACON_UI_SNIPPET, "/repo/src/main.ts", TARGET),
    null,
  );
});

test("kukaiLinkOverride wires the config and transform hooks", () => {
  const plugin = kukaiLinkOverride(TARGET);
  assert.ok(plugin);
  assert.equal(typeof plugin.config, "function");
  assert.equal(typeof plugin.transform, "function");
});
