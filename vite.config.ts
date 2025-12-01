import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  define: {
    global: "globalThis",
  },
  build: {
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
        },
      },
    },
  },
});
