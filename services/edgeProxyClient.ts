const EDGE_PROXY_URL =
  (typeof import.meta !== 'undefined' && (import.meta as { env?: Record<string, string> }).env?.VITE_EDGE_PROXY_URL) ||
  'https://api.moodtrip.app';

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
  const cached = readStoredToken();
  if (cached) return cached;
  return fetchAnonToken();
}

export interface GenerateOptions {
  model?: 'flash' | 'flash-lite';
  generationConfig?: Record<string, unknown>;
  systemInstruction?: unknown;
  supabaseToken?: string | null;
}

export interface GeminiContent {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
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
      body: JSON.stringify({
        model: opts.model ?? 'flash',
        contents,
        generationConfig: opts.generationConfig,
        systemInstruction: opts.systemInstruction,
      }),
    });
  };

  let res = await doFetch(token);

  if (res.status === 401 && !opts.supabaseToken) {
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
  const part = response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!part) throw new EdgeProxyError('Empty response', 'EMPTY_RESPONSE', 200);
  return part;
}
