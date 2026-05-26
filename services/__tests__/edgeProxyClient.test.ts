import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EdgeProxyError, generate, getAuthToken } from '../edgeProxyClient';

const ANON_TOKEN_LS_KEY = 'moodtrip_anon_token_v1';
const ANON_TOKEN_EXPIRY_LS_KEY = 'moodtrip_anon_token_expiry_v1';

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
  });
}

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getAuthToken', () => {
  it('returns the supabase token directly when provided', async () => {
    const token = await getAuthToken('supa-jwt-xyz');
    expect(token).toBe('supa-jwt-xyz');
  });

  it('returns cached anon token if not expired', async () => {
    localStorage.setItem(ANON_TOKEN_LS_KEY, 'cached.anon.jwt');
    localStorage.setItem(ANON_TOKEN_EXPIRY_LS_KEY, String(Date.now() + 600_000));
    const token = await getAuthToken();
    expect(token).toBe('cached.anon.jwt');
  });

  it('refetches when cached token is close to expiry', async () => {
    localStorage.setItem(ANON_TOKEN_LS_KEY, 'stale.anon.jwt');
    localStorage.setItem(ANON_TOKEN_EXPIRY_LS_KEY, String(Date.now() + 1_000));
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ token: 'fresh.jwt', expiresIn: 900, tier: 'anonymous' }));
    const token = await getAuthToken();
    expect(token).toBe('fresh.jwt');
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it('fetches a new anon token when none cached', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ token: 'new.jwt', expiresIn: 900, tier: 'anonymous' }));
    const token = await getAuthToken();
    expect(token).toBe('new.jwt');
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(localStorage.getItem(ANON_TOKEN_LS_KEY)).toBe('new.jwt');
  });
});

describe('generate', () => {
  it('sends a Gemini-shaped POST with bearer token', async () => {
    localStorage.setItem(ANON_TOKEN_LS_KEY, 'tok.abc');
    localStorage.setItem(ANON_TOKEN_EXPIRY_LS_KEY, String(Date.now() + 600_000));

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({
        candidates: [{ content: { parts: [{ text: '{"destination":"Đà Lạt"}' }] } }],
      }),
    );

    const res = await generate([{ role: 'user', parts: [{ text: 'plan' }] }]);
    expect(res.candidates?.[0]?.content?.parts?.[0]?.text).toContain('Đà Lạt');

    const [, init] = fetchSpy.mock.calls[0]!;
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.contents[0].role).toBe('user');
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: 'Bearer tok.abc',
    });
  });

  it('re-mints the anon token on 401 and retries once', async () => {
    localStorage.setItem(ANON_TOKEN_LS_KEY, 'expired.jwt');
    localStorage.setItem(ANON_TOKEN_EXPIRY_LS_KEY, String(Date.now() + 600_000));

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ code: 'UNAUTHENTICATED' }, { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({ token: 'fresh.jwt', expiresIn: 900, tier: 'anonymous' }))
      .mockResolvedValueOnce(
        jsonResponse({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] }),
      );

    const res = await generate([{ role: 'user', parts: [{ text: 'plan' }] }]);
    expect(res.candidates?.[0]?.content?.parts?.[0]?.text).toBe('ok');
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(localStorage.getItem(ANON_TOKEN_LS_KEY)).toBe('fresh.jwt');
  });

  it('does NOT re-mint when supabase token was supplied and 401 occurs', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ code: 'UNAUTHENTICATED' }, { status: 401 }));

    await expect(
      generate([{ role: 'user', parts: [{ text: 'plan' }] }], { supabaseToken: 'supa.jwt' }),
    ).rejects.toBeInstanceOf(EdgeProxyError);
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it('throws EdgeProxyError with RATE_LIMIT_EXCEEDED on 429', async () => {
    localStorage.setItem(ANON_TOKEN_LS_KEY, 'tok.abc');
    localStorage.setItem(ANON_TOKEN_EXPIRY_LS_KEY, String(Date.now() + 600_000));

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse(
        { code: 'RATE_LIMIT_EXCEEDED', error: 'limit', retryAfterSeconds: 3600 },
        { status: 429 },
      ),
    );

    await expect(
      generate([{ role: 'user', parts: [{ text: 'plan' }] }]),
    ).rejects.toMatchObject({ code: 'RATE_LIMIT_EXCEEDED', status: 429, retryAfterSeconds: 3600 });
  });

  it('throws BUDGET_EXCEEDED on 503', async () => {
    localStorage.setItem(ANON_TOKEN_LS_KEY, 'tok.abc');
    localStorage.setItem(ANON_TOKEN_EXPIRY_LS_KEY, String(Date.now() + 600_000));

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({ code: 'BUDGET_EXCEEDED', error: 'paused' }, { status: 503 }),
    );

    await expect(
      generate([{ role: 'user', parts: [{ text: 'plan' }] }]),
    ).rejects.toMatchObject({ code: 'BUDGET_EXCEEDED', status: 503 });
  });
});
