import type { Env } from './types';
import { secondsUntilUtcMidnight, utcDateKey } from './rateLimit';

const SPEND_KEY_PREFIX = 's:';

export interface SpendStatus {
  todayUsd: number;
  limitUsd: number;
  exceeded: boolean;
}

export async function readSpend(env: Env): Promise<SpendStatus> {
  const key = `${SPEND_KEY_PREFIX}${utcDateKey()}`;
  const limit = Number(env.DAILY_SPEND_LIMIT_USD);
  const raw = await env.SPEND_TRACKER.get(key);
  const todayUsd = raw ? Number(raw) : 0;
  return { todayUsd, limitUsd: limit, exceeded: todayUsd >= limit };
}

export async function addSpend(env: Env, deltaUsd: number): Promise<number> {
  if (deltaUsd <= 0) return readSpend(env).then((s) => s.todayUsd);
  const key = `${SPEND_KEY_PREFIX}${utcDateKey()}`;
  const raw = await env.SPEND_TRACKER.get(key);
  const next = (raw ? Number(raw) : 0) + deltaUsd;
  await env.SPEND_TRACKER.put(key, next.toFixed(6), {
    expirationTtl: secondsUntilUtcMidnight() + 24 * 3600,
  });
  return next;
}

export function estimateCostUsd(
  env: Env,
  model: 'flash' | 'flash-lite',
  promptTokens: number,
  outputTokens: number,
): number {
  const isLite = model === 'flash-lite';
  const inputRate = Number(
    isLite ? env.GEMINI_FLASH_LITE_INPUT_USD_PER_MTOK : env.GEMINI_FLASH_INPUT_USD_PER_MTOK,
  );
  const outputRate = Number(
    isLite ? env.GEMINI_FLASH_LITE_OUTPUT_USD_PER_MTOK : env.GEMINI_FLASH_OUTPUT_USD_PER_MTOK,
  );
  return (promptTokens * inputRate + outputTokens * outputRate) / 1_000_000;
}
