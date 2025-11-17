/// <reference types="vite/client" />

declare global {
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
