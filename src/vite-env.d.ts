/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    /** Set by the dev-only Kukai link override; see vite-plugins/. */
    readonly KUKAI_URL_OVERRIDE?: string;
    /** Reown (WalletConnect) project ID; required by `npm run build:verified`. */
    readonly VITE_REOWN_PROJECT_ID?: string;
  }

  var Buffer: typeof import("buffer").Buffer;
  var process: typeof import("process");
}

declare module "@tezos-core-tools/crypto-utils" {
  export const utils: {
    seedToKeyPair: (seed: Buffer) => {
      sk: Buffer;
      pk: Buffer;
    };
  };
}

declare module "process/browser";
