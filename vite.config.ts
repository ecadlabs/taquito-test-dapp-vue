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
      protocolImports: true,
    }),
  ],
  optimizeDeps: {
    exclude: ["@taquito/sapling-wasm"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "vite-plugin-node-polyfills/shims/buffer": fileURLToPath(
        new URL(
          "./node_modules/vite-plugin-node-polyfills/shims/buffer/dist/index.js",
          import.meta.url,
        ),
      ),
      "vite-plugin-node-polyfills/shims/process": fileURLToPath(
        new URL(
          "./node_modules/vite-plugin-node-polyfills/shims/process/dist/index.js",
          import.meta.url,
        ),
      ),
    },
  },
  define: {
    global: "globalThis",
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
            "@taquito/beacon-wallet",
            "@ecadlabs/beacon-dapp",
            "@ecadlabs/beacon-ui",
            "@ecadlabs/beacon-types",
          ],
          web3auth: ["@web3auth/modal", "@web3auth/base"],
          "crypto-libs": ["@noble/hashes", "@tezos-core-tools/crypto-utils"],
          "ui-components": ["reka-ui", "@vueuse/core"],
          "vue-ecosystem": ["vue", "vue-router", "pinia", "vue-sonner"],
        },
      },
    },
  },
});
