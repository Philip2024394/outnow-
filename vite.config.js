import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  envPrefix: 'VITE_',
  base: '/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        vendor: resolve(__dirname, 'vendor.html'),
        driver: resolve(__dirname, 'driver.html'),
        cardrive: resolve(__dirname, 'cardrive.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks: {
          // Vendor splits — loaded once, cached forever
          'vendor-react': ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-map': ['leaflet', 'react-leaflet'],
          'vendor-stripe': ['@stripe/stripe-js'],
          'vendor-firebase': ['firebase/app', 'firebase/firestore', 'firebase/auth'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
})
