import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    // Long-cache hashed assets in local preview (mirrors recommended prod headers)
    headers: {
      'Cache-Control': 'public, max-age=600',
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: 2048,
    sourcemap: false,
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        // Keep a single app chunk: bank.json + scoring stay local, one download
        manualChunks: undefined,
      },
    },
  },
})
