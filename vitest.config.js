// Vitest configuration — loads .env for test runs and sets a 30-second timeout.

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
    setupFiles: ['./tests/setup.js'],
  },
});
