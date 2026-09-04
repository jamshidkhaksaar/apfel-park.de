import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  envDir: false,
  test: {
    environment: 'node',
    include: ['scripts/integration/payment-db.integration.ts'],
    fileParallelism: false,
    hookTimeout: 30000,
    testTimeout: 15000,
  },
  resolve: { alias: { '@': fileURLToPath(new URL('../../src', import.meta.url)) } },
});
