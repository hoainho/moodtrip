import { getSupabaseAccessToken } from './authSession';

const VITE_ENV = (typeof import.meta !== 'undefined' ? (import.meta as { env?: Record<string, string | boolean> }).env : undefined) || {};
const IS_DEV = Boolean(VITE_ENV.DEV);
const CONFIGURED_PROXY_URL = typeof VITE_ENV.VITE_EDGE_PROXY_URL === 'string' ? (VITE_ENV.VITE_EDGE_PROXY_URL as string).trim() : '';
// In dev, an empty base means same-origin (the Vite devEdgeProxy middleware serves /v1/*).
// In production there is no such middleware, so the backend MUST be configured via
// VITE_EDGE_PROXY_URL at build time. We deliberately do NOT fall back to a hard-coded domain —
// a stale/placeholder domain produced a cryptic ERR_NAME_NOT_RESOLVED. See assertProxyConfigured().
const EDGE_PROXY_URL = CONFIGURED_PROXY_URL || '';

const ANON_TOKEN_LS_KEY = 'moodtrip_anon_token_v1';
const ANON_TOKEN_EXPIRY_LS_KEY = 'moodtrip_anon_token_expiry_v1';

interface AnonTokenResponse {
  token: string;
  expiresIn: number;
  tier: string;
}

export class EdgeProxyError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'EdgeProxyError';
  }
}

// Fail fast with an actionable message when the backend isn't wired up in a hosted build,
// instead of letting fetch() surface a raw DNS/network error.
function assertProxyConfigured(): void {
  if (!IS_DEV && !EDGE_PROXY_URL) {
    throw new EdgeProxyError(
      'Backend chưa được cấu hình: thiếu VITE_EDGE_PROXY_URL (URL của edge-proxy Worker) trong môi trường build của host.',
      'PROXY_NOT_CONFIGURED',
      0,
    );
  }
}

function readStoredToken(): string | null {
  try {
    const token = localStorage.getItem(ANON_TOKEN_LS_KEY);
    const expiryRaw = localStorage.getItem(ANON_TOKEN_EXPIRY_LS_KEY);
    if (!token || !expiryRaw) return null;
    const expiry = Number(expiryRaw);
    if (Number.isNaN(expiry) || expiry < Date.now() + 30_000) return null;
    return token;
  } catch {
    return null;
  }
}

function storeToken(token: string, expiresInSeconds: number): void {
  try {
    localStorage.setItem(ANON_TOKEN_LS_KEY, token);
    localStorage.setItem(
      ANON_TOKEN_EXPIRY_LS_KEY,
      String(Date.now() + expiresInSeconds * 1000),
    );
  } catch {
    void 0;
  }
}

async function fetchAnonToken(): Promise<string> {
  assertProxyConfigured();
  const res = await fetch(`${EDGE_PROXY_URL}/v1/anon-token`, {
    method: 'POST',
    credentials: 'omit',
  });
  if (!res.ok) {
    throw new EdgeProxyError(
      `Failed to mint anonymous token: ${res.status}`,
      'ANON_TOKEN_FAILED',
      res.status,
    );
  }
  const body = (await res.json()) as AnonTokenResponse;
  storeToken(body.token, body.expiresIn);
  return body.token;
}

export async function getAuthToken(supabaseToken?: string | null): Promise<string> {
  if (supabaseToken) return supabaseToken;
  const liveSupabase = await getSupabaseAccessToken();
  if (liveSupabase) return liveSupabase;
  const cached = readStoredToken();
  if (cached) return cached;
  return fetchAnonToken();
}

export interface GenerateOptions {
  model?: 'flash' | 'flash-lite';
  generationConfig?: Record<string, unknown>;
  systemInstruction?: unknown;
  supabaseToken?: string | null;
  /** Aborts the underlying fetch(es) when triggered (timeout or user cancel). */
  signal?: AbortSignal;
}

export interface GeminiContent {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

export async function generate(
  contents: GeminiContent[],
  opts: GenerateOptions = {},
): Promise<GeminiGenerateResponse> {
  assertProxyConfigured();
  let token = await getAuthToken(opts.supabaseToken);

  const doFetch = async (bearer: string): Promise<Response> => {
    return fetch(`${EDGE_PROXY_URL}/v1/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bearer}`,
        'x-moodtrip-client': 'web',
      },
      credentials: 'omit',
      signal: opts.signal,
      body: JSON.stringify({
        model: opts.model ?? 'flash',
        contents,
        generationConfig: opts.generationConfig,
        systemInstruction: opts.systemInstruction,
      }),
    });
  };

  let res = await doFetch(token);

  const isSupabaseToken = Boolean(opts.supabaseToken) || (await getSupabaseAccessToken()) === token;
  if (res.status === 401 && !isSupabaseToken) {
    try {
      localStorage.removeItem(ANON_TOKEN_LS_KEY);
      localStorage.removeItem(ANON_TOKEN_EXPIRY_LS_KEY);
    } catch {
      void 0;
    }
    token = await fetchAnonToken();
    res = await doFetch(token);
  }

  if (!res.ok) {
    const errorBody = await res
      .json()
      .catch(() => ({ code: 'UNKNOWN', error: res.statusText })) as {
      code?: string;
      error?: string;
      retryAfterSeconds?: number;
    };
    throw new EdgeProxyError(
      errorBody.error ?? `Edge proxy error ${res.status}`,
      errorBody.code ?? 'UNKNOWN',
      res.status,
      errorBody.retryAfterSeconds,
    );
  }

  return (await res.json()) as GeminiGenerateResponse;
}

export function extractText(response: GeminiGenerateResponse): string {
  const parts = response.candidates?.[0]?.content?.parts;
  const answerPart = parts?.find((p) => !p.thought && typeof p.text === 'string' && p.text.length > 0);
  if (!answerPart?.text) throw new EdgeProxyError('Empty response', 'EMPTY_RESPONSE', 200);
  return answerPart.text;
}
