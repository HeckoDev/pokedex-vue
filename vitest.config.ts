import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'url';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/utils/__tests__/setup.ts'],
    // Exclude e2e tests (Playwright) from Vitest
    exclude: ['**/node_modules/**', '**/e2e/**', '**/playwright-report/**'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
