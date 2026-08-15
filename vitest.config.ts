import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    testTimeout: 20000,
    // Each file spins up jsdom + full MUI renders; running files in parallel
    // workers causes CPU contention and flaky timeouts on modest machines.
    fileParallelism: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}', 'electron/shared.ts'],
      exclude: ['src/main.tsx', 'src/test/**'],
    },
  },
})
