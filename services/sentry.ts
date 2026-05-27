import * as Sentry from '@sentry/react';

const SENSITIVE_HEADER_KEYS = ['authorization', 'cookie', 'set-cookie', 'x-moodtrip-client'];

const PII_FIELD_KEYS = new Set([
  'email',
  'phone',
  'fullName',
  'personalNote',
  'startLocation',
  'token',
  'access_token',
  'refresh_token',
  'authorization',
]);

function scrubObject(input: unknown): unknown {
  if (Array.isArray(input)) return input.map(scrubObject);
  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (PII_FIELD_KEYS.has(k.toLowerCase())) {
        out[k] = '[Filtered]';
      } else {
        out[k] = scrubObject(v);
      }
    }
    return out;
  }
  return input;
}

export function initSentry(): void {
  const dsn =
    (typeof import.meta !== 'undefined' && (import.meta as { env?: Record<string, string> }).env?.VITE_SENTRY_DSN) ||
    '';
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment:
      (typeof import.meta !== 'undefined' && (import.meta as { env?: Record<string, string> }).env?.MODE) ||
      'production',
    sendDefaultPii: false,
    tracesSampleRate: 0.05,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    beforeSend(event) {
      if (event.request?.headers) {
        for (const key of Object.keys(event.request.headers)) {
          if (SENSITIVE_HEADER_KEYS.includes(key.toLowerCase())) {
            event.request.headers[key] = '[Filtered]';
          }
        }
      }
      if (event.request?.data) {
        event.request.data = scrubObject(event.request.data);
      }
      if (event.extra) {
        event.extra = scrubObject(event.extra) as Record<string, unknown>;
      }
      delete event.user;
      return event;
    },
  });
}
