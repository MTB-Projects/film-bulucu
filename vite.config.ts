import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Development için API proxy (opsiyonel)
    // Vercel veya Netlify serverless function'ları local'de test etmek için
    proxy: {
      '/api': {
        target: 'http://localhost:8888', // Vercel CLI veya Netlify Dev port
        changeOrigin: true,
        rewrite: (path) => path,
      },
      '/.netlify/functions': {
        target: 'http://localhost:8888', // Netlify Dev port
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
}) 