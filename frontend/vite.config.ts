import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        // Use IPv4 explicitly: on this host `localhost` can resolve to an unrelated
        // service bound on ::1:8000, while the development API listens on 127.0.0.1.
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
})
