import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // Allows using describe/it without importing (optional)
    environment: 'node',
    testTimeout: 60000, // 60s Global timeout for container operations
    hookTimeout: 60000, // 60s specifically for beforeAll hooks
  },
});