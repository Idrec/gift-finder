import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Sayt 3000-portda, admin panel — 3001-portda
    port: 3001,
    strictPort: true,
  },
})
