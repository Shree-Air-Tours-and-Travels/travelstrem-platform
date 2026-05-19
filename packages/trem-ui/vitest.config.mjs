import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@packages/trem-utils': path.resolve(__dirname, '../trem-utils/src'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx}'],
    setupFiles: ['./src/test-setup.js'],
    css: false,
  },
});
