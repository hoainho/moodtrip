import type { PostHog } from 'posthog-js';

type Meta = { env?: Record<string, string> };

let cached: PostHog | null = null;
let attempted = false;

async function ensurePosthog(): Promise<PostHog | null> {
  if (cached) return cached;
  if (attempted) return null;
  attempted = true;

  const key = (typeof import.meta !== 'undefined' && (import.meta as Meta).env?.VITE_POSTHOG_KEY) || '';
  if (!key) return null;
  const host =
    (typeof import.meta !== 'undefined' && (import.meta as Meta).env?.VITE_POSTHOG_HOST) ||
    'https://app.posthog.com';

  const mod = await import('posthog-js');
  const instance = mod.default;
  instance.init(key, {
    api_host: host,
    capture_pageview: true,
    disable_session_recording: true,
    persistence: 'localStorage+cookie',
    autocapture: false,
    sanitize_properties: (properties) => {
      const cleaned: Record<string, unknown> = { ...properties };
      for (const k of Object.keys(cleaned)) {
        if (/email|phone|token|password|personalNote/i.test(k)) cleaned[k] = '[redacted]';
      }
      return cleaned;
    },
  });
  cached = instance;
  return cached;
}

export async function trackEvent(
  name: string,
  properties: Record<string, unknown> = {},
): Promise<void> {
  const instance = await ensurePosthog();
  if (!instance) return;
  instance.capture(name, properties);
}

export async function identifyUser(userId: string, properties: Record<string, unknown> = {}): Promise<void> {
  const instance = await ensurePosthog();
  if (!instance) return;
  instance.identify(userId, properties);
}

export async function resetAnalyticsUser(): Promise<void> {
  const instance = await ensurePosthog();
  if (!instance) return;
  instance.reset();
}
