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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html', 'json', 'json-summary'],
      exclude: [
        'node_modules/',
        'src/**/__tests__/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.json',
        '**/dist/**',
        '**/coverage/**',
        'src/vite-env.d.ts',
        'src/components.d.ts',
        'e2e/**',
      ],
      all: true,
      lines: 85,
      functions: 85,
      branches: 70,
      statements: 85,
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
