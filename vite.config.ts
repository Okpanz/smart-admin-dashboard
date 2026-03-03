import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:7001',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:7001',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      // Keep images pointing to the external server as requested
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
      // Proxy for Liveness Check & Report APIs to the local monolith
      '/pensionaire': {
        target: 'http://localhost:7001',
        changeOrigin: true,
        secure: false,
        proxyTimeout: 90000,
        timeout: 90000,
      },
      '/i-am-alive': {
        target: 'http://localhost:7001',
        changeOrigin: true,
        secure: false,
        proxyTimeout: 90000,
        timeout: 90000,
      },
    },
  },
})
