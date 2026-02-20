import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://rivers.thesmartapps.org',
        changeOrigin: true,
        secure: false,
      },
      '/images': {
        target: 'https://rivers.thesmartapps.org',
        changeOrigin: true,
        secure: false,
      },
      '/bvn-images': {
        target: 'https://rivers.thesmartapps.org',
        changeOrigin: true,
        secure: false,
      },
      // Proxy for Liveness Check & Report APIs
      // proxyTimeout / timeout are in ms — 90 s to handle Render.com cold-start delays
      '/pensionaire': {
        target: 'https://i-am-alive-sever.onrender.com',
        changeOrigin: true,
        secure: false,
        proxyTimeout: 90000,
        timeout: 90000,
      },
      '/i-am-alive': {
        target: 'https://i-am-alive-sever.onrender.com',
        changeOrigin: true,
        secure: false,
        proxyTimeout: 90000,
        timeout: 90000,
      },
    },
  },
})
