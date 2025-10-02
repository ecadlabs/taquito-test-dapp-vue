import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "readable-stream": "vite-compatible-readable-stream",
      stream: "vite-compatible-readable-stream",
      buffer: "buffer",
      process: "process/browser",
    },
  },
  define: {
    global: "globalThis",
    Buffer: "globalThis.Buffer",
    process: "globalThis.process",
  },
  optimizeDeps: {
    include: ["buffer", "events", "process"],
  },
  build: {
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
