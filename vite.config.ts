import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Vite default port
    host: '127.0.0.1', // IPv4'e zorla (IPv6 izin sorunlarını önlemek için)
    // Development için API proxy
    // Vercel CLI ile local serverless function test etmek için
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8888', // Local server port
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
}) 