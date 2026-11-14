import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 5173-port Windows'da (Hyper-V/WinNAT) rezerv qilingan oraliqqa tushadi,
    // shuning uchun 3000-port ishlatiladi
    port: 3000,
    strictPort: true,
  },
})
