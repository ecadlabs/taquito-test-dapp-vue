import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "url";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "readable-stream": "vite-compatible-readable-stream",
      stream: "vite-compatible-readable-stream",
    },
  },
  define: {
    global: "globalThis",
  },
  optimizeDeps: {
    include: ["buffer", "events"],
  },
  build: {
    rollupOptions: {
      external: (id) => {
        // Exclude the scripts directory from the build as they won't be used on the live site
        return id.includes("/src/scripts/") || id.includes("\\src\\scripts\\");
      },
      output: {
        manualChunks: {
          // Separate Taquito core from signing utilities
          "taquito-core": ["@taquito/taquito"],
          "taquito-signing": [
            "@taquito/utils",
            "@taquito/michel-codec",
            "@taquito/signer",
            "@taquito/beacon-wallet",
            "@taquito/wallet-connect",
            "@taquito/ledger-signer",
            "@taquito/remote-signer",
          ],
          // Separate beacon/wallet connect dependencies
          "wallet-providers": [
            "@airgap/beacon-sdk",
            "@airgap/beacon-types",
            "@airgap/beacon-ui",
            "@airgap/beacon-dapp",
          ],
          // Crypto dependencies
          "crypto-libs": ["@noble/hashes"],
          // UI components (excluding lucide-vue-next to allow tree-shaking)
          "ui-components": ["reka-ui", "@vueuse/core"],
          // Vue ecosystem
          "vue-ecosystem": ["vue", "vue-router", "pinia", "vue-sonner"],
        },
      },
    },
  },
});
