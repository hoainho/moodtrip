import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: false,
    include: ['services/**/*.test.ts', 'services/**/__tests__/**/*.test.ts', 'src/**/*.test.ts', 'components/**/*.test.tsx'],
    exclude: ['workers/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['services/**/*.ts'],
      exclude: ['services/**/*.test.ts'],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
});
