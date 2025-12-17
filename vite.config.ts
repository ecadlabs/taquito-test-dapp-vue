import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    nodePolyfills({
      include: [
        "buffer",
        "process",
        "util",
        "events",
        "crypto",
        "string_decoder",
        "http",
        "https",
        "url",
        "zlib",
      ],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      overrides: {
        // Let vite-compatible-readable-stream handle streams to avoid inherits issues
        stream: "vite-compatible-readable-stream",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "readable-stream": "vite-compatible-readable-stream",
    },
  },
  define: {
    global: "globalThis",
  },
  optimizeDeps: {
    include: [
      "buffer",
      "events",
      "process",
      "util",
      "vite-compatible-readable-stream",
      "cross-fetch",
      "eventemitter2",
      "@metamask/sdk",
      "@metamask/providers",
    ],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: (id) => {
        return id.includes("/src/scripts/") || id.includes("\\src\\scripts\\");
      },
      output: {
        manualChunks: {
          beacon: [
            "@airgap/beacon-sdk",
            "@airgap/beacon-dapp",
            "@airgap/beacon-ui",
            "@airgap/beacon-types",
          ],
          web3auth: ["@web3auth/modal", "@web3auth/base"],
          "crypto-libs": ["@noble/hashes", "@tezos-core-tools/crypto-utils"],
          "ui-components": ["reka-ui", "@vueuse/core"],
          "vue-ecosystem": ["vue", "vue-router", "pinia", "vue-sonner"],
          // Sapling has large ZKP proving parameters - keep in separate chunk
          sapling: ["@taquito/sapling"],
        },
      },
    },
  },
});
