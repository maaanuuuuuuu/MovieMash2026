import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react()],
  server: {
    port: 4173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    exclude: ['node_modules', 'dist', '.analysis', 'e2e'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.ts'],
    setupFiles: './src/test/setup.ts',
  },
})
