import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import storeApi from './scripts/store-api.mjs';

export default defineConfig({
  plugins: [react(), storeApi()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.{js,jsx}', 'server/**/*.test.js'],
    restoreMocks: true,
  },
});
