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
    },
  },
})
