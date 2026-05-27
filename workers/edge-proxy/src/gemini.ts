import type { Env, GenerateRequest, GenerateResponse } from './types';

export interface GeminiCallResult {
  body: GenerateResponse;
  status: number;
  promptTokens: number;
  outputTokens: number;
  model: 'flash' | 'flash-lite';
}

export async function callGemini(env: Env, req: GenerateRequest): Promise<GeminiCallResult> {
  const model = req.model === 'flash-lite' ? 'flash-lite' : 'flash';
  const modelName = model === 'flash-lite' ? env.GEMINI_MODEL_LITE : env.GEMINI_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${env.GEMINI_API_KEY}`;

  const body: Record<string, unknown> = {
    contents: req.contents,
  };
  if (req.generationConfig) body.generationConfig = req.generationConfig;
  if (req.systemInstruction) body.systemInstruction = req.systemInstruction;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  const responseBody = (await res.json()) as GenerateResponse;
  const usage = responseBody.usageMetadata ?? {};

  return {
    body: responseBody,
    status: res.status,
    promptTokens: usage.promptTokenCount ?? 0,
    outputTokens: usage.candidatesTokenCount ?? 0,
    model,
  };
}
