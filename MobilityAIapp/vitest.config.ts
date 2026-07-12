import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals:     true,
    root:        '.',
    include:     ['tests/**/*.test.ts', 'tests/**/*.property.test.ts'],
    testTimeout: 30_000,  // 30s — token-limit property test can take ~10s in parallel
    hookTimeout: 10_000,
    // Use forks pool for Node.js 24 compatibility with vi.mock + dynamic imports
    pool:        'forks',
  },
  resolve: {
    alias: {
      '@':                        path.resolve(__dirname, 'frontend/src'),
      '@opusaimobility/common':   path.resolve(__dirname, 'shared/src'),
      '@packages/common':         path.resolve(__dirname, 'shared/src'),
      '@scripts/migrate':         path.resolve(__dirname, 'scripts/migrate/src'),
      '@scripts/ci':              path.resolve(__dirname, 'scripts/ci'),
    },
  },
});
