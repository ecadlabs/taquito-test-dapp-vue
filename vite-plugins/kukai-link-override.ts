import { readFile } from "node:fs/promises";
import type { Plugin, UserConfig } from "vite";

/**
 * Dev-only override that points Beacon's Kukai links (web, deep link and iOS)
 * at another Kukai, such as a local build behind a tunnel.
 *
 * It is set from `.env.local` or the shell, never from the browser, and only
 * runs under `vite serve`. A URL parameter or in-app setting would let anyone
 * send a link to the real deployment that opens a fake Kukai. The variable has
 * no `VITE_` prefix, so Vite does not expose it to production builds.
 */
export const KUKAI_URL_OVERRIDE_ENV = "KUKAI_URL_OVERRIDE";

/** Beacon-ui's bundled files, which hold the hardcoded wallet list. */
export const BEACON_UI_MODULE = /[\\/]@ecadlabs[\\/]beacon-ui[\\/].*\.js$/;

const KUKAI_LINK = /https:\/\/(?:[a-z0-9-]+\.)?kukai\.app|kukai:\/\//g;

const LOCAL_HOSTS: ReadonlySet<string> = new Set([
  "localhost",
  "127.0.0.1",
  "[::1]",
]);

/**
 * Returns the override URL without trailing slashes, or `undefined` when the
 * variable is unset or blank. Throws on anything else that isn't usable, so a
 * typo stops Vite instead of silently leaving the hosted Kukai in place.
 */
export const parseKukaiUrlOverride = (
  value: string | undefined,
): string | undefined => {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  const reject = (reason: string): never => {
    throw new Error(
      `${KUKAI_URL_OVERRIDE_ENV}="${trimmed}" is not usable: ${reason}`,
    );
  };
  if (!URL.canParse(trimmed)) return reject("it is not a URL");
  const url = new URL(trimmed);
  const isLocalHttp = url.protocol === "http:" && LOCAL_HOSTS.has(url.hostname);
  if (url.protocol !== "https:" && !isLocalHttp) {
    return reject("use https, or http on localhost");
  }
  // Beacon builds links as `${base}/wc?uri=...` and `${base}?type=tzip10...`.
  if (url.search || url.hash) {
    return reject("Beacon appends its own path and query to it");
  }
  return trimmed.replace(/\/+$/, "");
};

export const rewriteKukaiLinks = (code: string, target: string): string =>
  // A replacer function, so `$` sequences in the target are not patterns.
  code.replace(KUKAI_LINK, () => target);

export const loadBeaconUiModule = async (
  path: string,
  target: string,
): Promise<{ contents: string; loader: "js" }> => ({
  contents: rewriteKukaiLinks(await readFile(path, "utf8"), target),
  loader: "js",
});

export const kukaiOverrideConfig = (target: string): UserConfig => ({
  define: {
    [`import.meta.env.${KUKAI_URL_OVERRIDE_ENV}`]: JSON.stringify(target),
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        {
          // Vite hashes esbuild plugin names into its dependency cache key,
          // so changing the target re-bundles beacon-ui on the next start.
          name: `kukai-link-override:${target}`,
          setup(build) {
            build.onLoad({ filter: BEACON_UI_MODULE }, (args) =>
              loadBeaconUiModule(args.path, target),
            );
          },
        },
      ],
    },
  },
});

/** For when Vite serves beacon-ui directly instead of from its dep cache. */
export const transformBeaconUi = (
  code: string,
  id: string,
  target: string,
): string | null =>
  BEACON_UI_MODULE.test(id.split("?")[0])
    ? rewriteKukaiLinks(code, target)
    : null;

export const kukaiLinkOverride = (
  value: string | undefined,
): Plugin | undefined => {
  const target = parseKukaiUrlOverride(value);
  if (target === undefined) return undefined;
  return {
    name: "kukai-link-override",
    apply: "serve",
    config: () => kukaiOverrideConfig(target),
    transform: (code, id) => transformBeaconUi(code, id, target),
    configureServer(server) {
      server.config.logger.warn(
        `[${KUKAI_URL_OVERRIDE_ENV}] Beacon's Kukai links point to ${target}`,
      );
    },
  };
};
