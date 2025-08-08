import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      "readable-stream": "vite-compatible-readable-stream",
      stream: "vite-compatible-readable-stream"
    }
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['buffer', 'events']
  },
  build: {
    rollupOptions: {
      external: (id) => {
        // Exclude the scripts directory from the build as they won't be used on the live site
        return id.includes('/src/scripts/') || id.includes('\\src\\scripts\\')
      }
    }
  }
})
