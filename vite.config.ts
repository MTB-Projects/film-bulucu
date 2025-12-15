import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Development için API proxy
    // Vercel CLI ile local serverless function test etmek için
    proxy: {
      '/api': {
        target: 'http://localhost:8888', // Vercel CLI port (vercel dev çalışıyorsa)
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
}) 