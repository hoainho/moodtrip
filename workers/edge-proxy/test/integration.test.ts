import { describe, it, expect, beforeEach, vi } from 'vitest';
import worker from '../src/index';
import { env as testEnv, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import type { Env } from '../src/types';

const env = testEnv as unknown as Env;
const ORIGIN = 'http://localhost:5173';

function mockGeminiResponse(opts: {
  text?: string;
  promptTokens?: number;
  outputTokens?: number;
  status?: number;
}) {
  const body = {
    candidates: [{ content: { parts: [{ text: opts.text ?? '{"destination":"Đà Lạt"}' }] } }],
    usageMetadata: {
      promptTokenCount: opts.promptTokens ?? 1500,
      candidatesTokenCount: opts.outputTokens ?? 2500,
      totalTokenCount: (opts.promptTokens ?? 1500) + (opts.outputTokens ?? 2500),
    },
  };
  return new Response(JSON.stringify(body), {
    status: opts.status ?? 200,
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(async () => {
  vi.restoreAllMocks();
  await env.RATE_LIMIT.list().then(async ({ keys }) => {
    for (const k of keys) await env.RATE_LIMIT.delete(k.name);
  });
  await env.SPEND_TRACKER.list().then(async ({ keys }) => {
    for (const k of keys) await env.SPEND_TRACKER.delete(k.name);
  });
});

async function callWorker(req: Request): Promise<Response> {
  const ctx = createExecutionContext();
  const res = await worker.fetch(req, env, ctx);
  await waitOnExecutionContext(ctx);
  return res;
}

async function mintAnonForTest(): Promise<string> {
  const res = await callWorker(
    new Request('https://api.test/v1/anon-token', {
      method: 'POST',
      headers: { origin: ORIGIN, 'cf-connecting-ip': '203.0.113.7' },
    }),
  );
  const body = (await res.json()) as { token: string };
  return body.token;
}

describe('GET /v1/health', () => {
  it('returns 200', async () => {
    const res = await callWorker(new Request('https://api.test/v1/health'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });
});

describe('POST /v1/anon-token', () => {
  it('returns a JWT and expiresIn=900', async () => {
    const res = await callWorker(
      new Request('https://api.test/v1/anon-token', {
        method: 'POST',
        headers: { origin: ORIGIN, 'cf-connecting-ip': '203.0.113.7' },
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { token: string; expiresIn: number; tier: string };
    expect(body.tier).toBe('anonymous');
    expect(body.expiresIn).toBe(900);
    expect(body.token.split('.').length).toBe(3);
  });
});

describe('POST /v1/generate', () => {
  it('rejects requests with no Authorization header', async () => {
    const res = await callWorker(
      new Request('https://api.test/v1/generate', {
        method: 'POST',
        headers: { origin: ORIGIN, 'content-type': 'application/json' },
        body: '{}',
      }),
    );
    expect(res.status).toBe(401);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe('UNAUTHENTICATED');
  });

  it('rejects requests with invalid bearer token', async () => {
    const res = await callWorker(
      new Request('https://api.test/v1/generate', {
        method: 'POST',
        headers: {
          origin: ORIGIN,
          authorization: 'Bearer not-a-real-jwt',
          'content-type': 'application/json',
        },
        body: '{}',
      }),
    );
    expect(res.status).toBe(401);
  });

  it('completes a happy-path generation with anonymous JWT', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      mockGeminiResponse({ text: '{"destination":"Đà Lạt"}', promptTokens: 1500, outputTokens: 2500 }),
    );
    const token = await mintAnonForTest();

    const res = await callWorker(
      new Request('https://api.test/v1/generate', {
        method: 'POST',
        headers: {
          origin: ORIGIN,
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'plan a trip' }] }],
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { candidates: Array<{ content: { parts: Array<{ text: string }> } }> };
    expect(body.candidates?.[0]?.content?.parts?.[0]?.text).toContain('Đà Lạt');
  });

  it('enforces anonymous daily limit of 1', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      mockGeminiResponse({ promptTokens: 100, outputTokens: 100 }),
    );
    const token = await mintAnonForTest();
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

    const first = await callWorker(req());
    expect(first.status).toBe(200);

    const second = await callWorker(req());
    expect(second.status).toBe(429);
    const errBody = (await second.json()) as { code: string; retryAfterSeconds: number };
    expect(errBody.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(errBody.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('returns 503 BUDGET_EXCEEDED when daily spend cap is reached', async () => {
    const today = new Date().toISOString().slice(0, 10);
    await env.SPEND_TRACKER.put(`s:${today}`, String(Number(env.DAILY_SPEND_LIMIT_USD) + 1));

    const token = await mintAnonForTest();
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
    expect(res.status).toBe(503);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe('BUDGET_EXCEEDED');
  });

  it('returns 400 for invalid JSON body', async () => {
    const token = await mintAnonForTest();
    const res = await callWorker(
      new Request('https://api.test/v1/generate', {
        method: 'POST',
        headers: {
          origin: ORIGIN,
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: 'not json',
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe('BAD_REQUEST');
  });
});

describe('GET /v1/spend-status', () => {
  it('returns 403 without internal token', async () => {
    const res = await callWorker(new Request('https://api.test/v1/spend-status'));
    expect(res.status).toBe(403);
  });

  it('returns spend status with valid internal token', async () => {
    const res = await callWorker(
      new Request('https://api.test/v1/spend-status', {
        headers: { 'x-internal-token': env.INTERNAL_MONITOR_TOKEN },
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { todayUsd: number; limitUsd: number; exceeded: boolean };
    expect(body.limitUsd).toBe(Number(env.DAILY_SPEND_LIMIT_USD));
    expect(body.exceeded).toBe(false);
  });
});

describe('404 fallback', () => {
  it('returns 404 for unknown paths', async () => {
    const res = await callWorker(new Request('https://api.test/v1/unknown'));
    expect(res.status).toBe(404);
  });
});
