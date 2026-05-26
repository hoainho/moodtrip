import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import { hashIp } from './crypto';
import { mintAnonToken, verifyToken } from './jwt';
import { consumeQuota } from './rateLimit';
import { addSpend, estimateCostUsd, readSpend } from './spendTracker';
import { callGemini } from './gemini';

const app = new Hono<{ Bindings: Env }>();

app.use('*', async (c, next) => {
  const allowed = c.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim());
  return cors({
    origin: (origin) => (origin && allowed.includes(origin) ? origin : ''),
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['content-type', 'authorization', 'x-moodtrip-client'],
    maxAge: 86400,
  })(c, next);
});

app.get('/v1/health', (c) => c.json({ ok: true, ts: Date.now() }));

app.post('/v1/anon-token', async (c) => {
  const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? 'unknown';
  const ipHash = await hashIp(ip, c.env.JWT_SIGNING_SECRET);
  const { token, expiresIn } = await mintAnonToken(c.env, ipHash);
  return c.json({ token, expiresIn, tier: 'anonymous' });
});

app.post('/v1/generate', async (c) => {
  const authHeader = c.req.header('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing bearer token', code: 'UNAUTHENTICATED' }, 401);
  }
  const token = authHeader.slice('Bearer '.length).trim();

  let claims;
  try {
    claims = await verifyToken(c.env, token);
  } catch {
    return c.json({ error: 'Invalid or expired token', code: 'UNAUTHENTICATED' }, 401);
  }

  const spend = await readSpend(c.env);
  if (spend.exceeded) {
    return c.json(
      {
        error: 'Daily spend cap reached. Generation paused until UTC midnight.',
        code: 'BUDGET_EXCEEDED',
      },
      503,
    );
  }

  const quota = await consumeQuota(c.env, claims);
  if (!quota.allowed) {
    return c.json(
      {
        error: 'Daily generation quota exhausted for this tier.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfterSeconds: quota.resetSeconds,
      },
      429,
    );
  }

  const reqJson = await c.req.json().catch(() => null);
  if (!reqJson || typeof reqJson !== 'object') {
    return c.json({ error: 'Invalid JSON body', code: 'BAD_REQUEST' }, 400);
  }

  const result = await callGemini(c.env, reqJson as Parameters<typeof callGemini>[1]);

  if (result.status >= 200 && result.status < 300) {
    const cost = estimateCostUsd(c.env, result.model, result.promptTokens, result.outputTokens);
    c.executionCtx.waitUntil(addSpend(c.env, cost));
  }

  return c.json(result.body, result.status as 200);
});

app.get('/v1/spend-status', async (c) => {
  const token = c.req.header('x-internal-token');
  if (token !== c.env.INTERNAL_MONITOR_TOKEN) {
    return c.json({ error: 'Forbidden', code: 'FORBIDDEN' }, 403);
  }
  const spend = await readSpend(c.env);
  return c.json(spend);
});

app.notFound((c) => c.json({ error: 'Not found', code: 'NOT_FOUND' }, 404));

app.onError((err, c) => {
  console.error('[edge-proxy] unhandled error', err);
  return c.json({ error: 'Internal server error', code: 'INTERNAL' }, 500);
});

export default app;
