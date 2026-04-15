import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Needed for Electron file:// loading (avoid /assets => C:\assets)
  base: './',
  build: {
    outDir: 'dist-renderer',
    emptyOutDir: true,
  },
})
