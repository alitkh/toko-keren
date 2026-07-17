import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth', 'firebase/database'],
          phosphor: ['@phosphor-icons/react'],
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  // SPA fallback so /admin, /courier, /track/:token work on Vercel
  server: {
    historyApiFallback: true,
    host: true,            // bind 0.0.0.0 supaya bisa diakses dari luar Termux (browser HP)
    port: 5173,
    strictPort: false,
    allowedHosts: true,    // izinkan akses via IP/hostname apa pun di dev
  },
})
