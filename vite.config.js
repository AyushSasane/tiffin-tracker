import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Disable the Vite splash screen
    sourcemap: false, // Optional: you can choose whether to include sourcemaps
    outDir: 'dist', // Specify output directory if needed
  },
  server: {
    hmr: true, // Enable Hot Module Replacement for dev mode
  },
})
