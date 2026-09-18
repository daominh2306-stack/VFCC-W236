import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Relative assets make the same dist/ folder portable across root domains,
  // GitHub Pages subpaths, and ordinary static file servers.
  base: process.env.BASE_PATH || './',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'graph-vendor': ['@dagrejs/dagre', '@xyflow/react'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    css: true,
  },
})
