import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Split large vendor chunks to improve load performance and eliminate
    // the "chunk size > 500kB" warning that appears with the default single bundle.
    rollupOptions: {
      output: {
        manualChunks: {
          // MUI core + emotion (styling engine) — largest dependency
          'vendor-mui': [
            '@mui/material',
            '@mui/icons-material',
            '@mui/lab',
            '@emotion/react',
            '@emotion/styled',
          ],
          // React ecosystem
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Charting
          'vendor-charts': ['recharts'],
          // PDF / image export (dynamic — bundled at usage site)
          // 'vendor-pdf': ['jspdf', 'html2canvas'],
          // HTTP client
          'vendor-axios': ['axios'],
        },
      },
    },
    // Raise warning threshold to 600 kB (each split chunk stays well below this)
    chunkSizeWarningLimit: 600,
  },
})
