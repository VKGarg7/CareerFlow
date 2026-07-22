import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    // Generous timeouts: page-level tests render large component trees, and under
    // full-suite parallel load the 5s default flakes on slower machines.
    testTimeout: 30000,
    hookTimeout: 30000,
  },
})
