import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
        miniflare: {
          compatibilityFlags: ['nodejs_compat'],
          bindings: {
            GEMINI_API_KEY: 'test-gemini-key',
            JWT_SIGNING_SECRET: 'test-jwt-secret-must-be-at-least-32-bytes-long-xx',
            SUPABASE_JWT_SECRET: 'test-supa-secret-must-be-at-least-32-bytes-long-xx',
            INTERNAL_MONITOR_TOKEN: 'test-internal-token',
          },
        },
      },
    },
  },
});
