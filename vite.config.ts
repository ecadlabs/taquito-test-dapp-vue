import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    nodePolyfills({
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  optimizeDeps: {
    include: ["@taquito/sapling"],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: (id) => {
        // Exclude the scripts directory from the build as they won't be used on the live site
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
          // Web3Auth packages
          web3auth: ["@web3auth/modal", "@web3auth/base"],
          // Crypto dependencies
          "crypto-libs": ["@noble/hashes", "@tezos-core-tools/crypto-utils"],
          // UI components (excluding lucide-vue-next to allow tree-shaking)
          "ui-components": ["reka-ui", "@vueuse/core"],
          // Vue ecosystem
          "vue-ecosystem": ["vue", "vue-router", "pinia", "vue-sonner"],
        },
      },
    },
  },
});
