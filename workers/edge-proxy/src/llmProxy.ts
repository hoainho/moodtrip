import type { Env, GenerateRequest, GenerateResponse } from './types';
import type { GeminiCallResult } from './gemini';

// Adapter: the MoodTrip frontend speaks Gemini's native generateContent shape, but
// proxy.hoainho.info is an OpenAI-compatible server (POST /v1/chat/completions). This module
// translates Gemini request -> OpenAI request, and OpenAI response -> the Gemini-shaped
// GenerateResponse the rest of the app already parses. The bearer key stays server-side here.

interface OpenAiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GeminiPart {
  text?: string;
}

interface GeminiContent {
  role?: string;
  parts?: GeminiPart[];
}

interface OpenAiResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}

function partsToText(parts: GeminiPart[] | undefined): string {
  if (!Array.isArray(parts)) return '';
  return parts
    .map((p) => p?.text ?? '')
    .filter(Boolean)
    .join('\n');
}

/** Gemini contents (role user|model) + systemInstruction -> OpenAI messages (system|user|assistant). */
export function toOpenAiMessages(systemInstruction: unknown, contents: unknown): OpenAiMessage[] {
  const messages: OpenAiMessage[] = [];
  const sysText = partsToText((systemInstruction as GeminiContent | undefined)?.parts);
  if (sysText) messages.push({ role: 'system', content: sysText });

  const arr = Array.isArray(contents) ? contents : contents ? [contents] : [];
  for (const c of arr as GeminiContent[]) {
    const role: 'user' | 'assistant' = c?.role === 'model' ? 'assistant' : 'user';
    const text = partsToText(c?.parts);
    if (text) messages.push({ role, content: text });
  }
  return messages;
}

function modelFor(env: Env, req: GenerateRequest): string {
  return req.model === 'flash-lite'
    ? env.LLM_PROXY_MODEL_LITE || env.LLM_PROXY_MODEL || ''
    : env.LLM_PROXY_MODEL || env.LLM_PROXY_MODEL_LITE || '';
}

export function buildOpenAiRequest(env: Env, req: GenerateRequest): Record<string, unknown> {
  const cfg = (req.generationConfig ?? {}) as Record<string, unknown>;
  const body: Record<string, unknown> = {
    model: modelFor(env, req),
    messages: toOpenAiMessages(req.systemInstruction, req.contents),
  };
  if (typeof cfg.temperature === 'number') body.temperature = cfg.temperature;
  if (typeof cfg.maxOutputTokens === 'number') body.max_tokens = cfg.maxOutputTokens;
  // Ask for strict JSON when the app does. Toggleable: some models/proxies reject response_format.
  const jsonMode = (env.LLM_PROXY_JSON_MODE ?? 'true') !== 'false';
  if (jsonMode && cfg.responseMimeType === 'application/json') {
    body.response_format = { type: 'json_object' };
  }
  return body;
}

/** Some models wrap JSON in a ```json ... ``` fence despite being asked not to — strip it. */
export function stripJsonFences(text: string): string {
  const t = text.trim();
  const m = t.match(/^```[a-zA-Z]*\s*\n?([\s\S]*?)\n?```$/);
  const inner = m?.[1];
  return inner !== undefined ? inner.trim() : t;
}

export function openAiToGemini(data: OpenAiResponse): GenerateResponse {
  const content = data.choices?.[0]?.message?.content ?? '';
  const usage = data.usage ?? {};
  return {
    candidates: [{ content: { parts: [{ text: stripJsonFences(content) }] } }],
    usageMetadata: {
      promptTokenCount: usage.prompt_tokens ?? 0,
      candidatesTokenCount: usage.completion_tokens ?? 0,
      totalTokenCount: usage.total_tokens ?? 0,
    },
  };
}

export async function callLlmProxy(env: Env, req: GenerateRequest): Promise<GeminiCallResult> {
  const model = req.model === 'flash-lite' ? 'flash-lite' : 'flash';
  const base = (env.LLM_PROXY_URL || '').replace(/\/+$/, '');
  const res = await fetch(`${base}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.LLM_PROXY_KEY ?? ''}`,
    },
    body: JSON.stringify(buildOpenAiRequest(env, req)),
  });

  const raw = (await res.json().catch(() => ({}))) as OpenAiResponse;
  if (!res.ok) {
    // Surface the proxy's real error/status to the client instead of a fake 200.
    return { body: raw as unknown as GenerateResponse, status: res.status, promptTokens: 0, outputTokens: 0, model };
  }

  const body = openAiToGemini(raw);
  const usage = body.usageMetadata ?? {};
  return {
    body,
    status: res.status,
    promptTokens: usage.promptTokenCount ?? 0,
    outputTokens: usage.candidatesTokenCount ?? 0,
    model,
  };
}
