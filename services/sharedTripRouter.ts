export interface SharedTripRoute {
  kind: 'shared-trip';
  slug: string;
}

export type Route = SharedTripRoute | { kind: 'app' };

const SHARED_PATH_PATTERN = /^\/t\/([a-z0-9]{6,16})\/?$/i;

export function parseCurrentRoute(): Route {
  if (typeof window === 'undefined') return { kind: 'app' };
  const path = window.location.pathname;
  const match = path.match(SHARED_PATH_PATTERN);
  if (match && match[1]) {
    return { kind: 'shared-trip', slug: match[1] };
  }
  return { kind: 'app' };
}

export function buildShareUrl(slug: string, base?: string): string {
  const origin =
    base ?? (typeof window !== 'undefined' ? window.location.origin : 'https://moodtrip.app');
  return `${origin}/t/${slug}`;
}

export function buildOgImageUrl(slug: string, edgeProxyBase?: string): string {
  type Meta = { env?: Record<string, string> };
  const proxy =
    edgeProxyBase ??
    (typeof import.meta !== 'undefined' && (import.meta as Meta).env?.VITE_EDGE_PROXY_URL) ??
    'https://api.moodtrip.app';
  return `${proxy}/v1/og/${slug}`;
}
