import { defineConfig } from 'vitest/config';

// Unit tests cover the app's logic (no browser needed), so they skip the app's Vite plugins.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
