import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SignJWT } from 'jose';
import worker from '../src/index';
import { env as testEnv, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import type { Env } from '../src/types';

const env = testEnv as unknown as Env;
const ORIGIN = 'http://localhost:5173';

function mockGeminiOk(): Response {
  return new Response(
    JSON.stringify({
      candidates: [{ content: { parts: [{ text: '{"destination":"Hue"}' }] } }],
      usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 100, totalTokenCount: 200 },
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
}

function freshGeminiMock(): () => Promise<Response> {
  return async () => mockGeminiOk();
}

async function mintFakeSupabaseJwt(opts: { sub: string; tier?: 'free' | 'paid' } = { sub: 'user-1' }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: Record<string, unknown> = {
    role: 'authenticated',
    sub: opts.sub,
  };
  if (opts.tier) payload.tier = opts.tier;
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(opts.sub)
    .setAudience('authenticated')
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(new TextEncoder().encode(env.SUPABASE_JWT_SECRET));
}

async function callWorker(req: Request): Promise<Response> {
  const ctx = createExecutionContext();
  const res = await worker.fetch(req, env, ctx);
  await waitOnExecutionContext(ctx);
  return res;
}

beforeEach(async () => {
  vi.restoreAllMocks();
  for (const k of (await env.RATE_LIMIT.list()).keys) await env.RATE_LIMIT.delete(k.name);
  for (const k of (await env.SPEND_TRACKER.list()).keys) await env.SPEND_TRACKER.delete(k.name);
});

describe('Supabase JWT verification', () => {
  it('accepts a valid Supabase token as free tier (default)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockGeminiOk());
    const token = await mintFakeSupabaseJwt({ sub: 'user-free' });
    const res = await callWorker(
      new Request('https://api.test/v1/generate', {
        method: 'POST',
        headers: {
          origin: ORIGIN,
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ contents: [] }),
      }),
    );
    expect(res.status).toBe(200);
  });

  it('enforces free tier daily limit of 3 across multiple Supabase JWT calls', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(freshGeminiMock());
    const token = await mintFakeSupabaseJwt({ sub: 'user-free-quota' });
    const req = () =>
      new Request('https://api.test/v1/generate', {
        method: 'POST',
        headers: {
          origin: ORIGIN,
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ contents: [] }),
      });

    for (let i = 0; i < 3; i++) {
      const res = await callWorker(req());
      expect(res.status).toBe(200);
    }
    const fourth = await callWorker(req());
    expect(fourth.status).toBe(429);
  });

  it('allows paid tier 50 calls/day', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(freshGeminiMock());
    const token = await mintFakeSupabaseJwt({ sub: 'user-paid', tier: 'paid' });
    const req = () =>
      new Request('https://api.test/v1/generate', {
        method: 'POST',
        headers: {
          origin: ORIGIN,
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ contents: [] }),
      });
    for (let i = 0; i < 4; i++) {
      const res = await callWorker(req());
      expect(res.status).toBe(200);
    }
  });

  it('rejects a Supabase token signed with wrong secret', async () => {
    const badToken = await new SignJWT({ role: 'authenticated' })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject('user-bad')
      .setAudience('authenticated')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode('wrong-secret-must-be-at-least-32-bytes-long-x'));
    const res = await callWorker(
      new Request('https://api.test/v1/generate', {
        method: 'POST',
        headers: {
          origin: ORIGIN,
          authorization: `Bearer ${badToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ contents: [] }),
      }),
    );
    expect(res.status).toBe(401);
  });
});
