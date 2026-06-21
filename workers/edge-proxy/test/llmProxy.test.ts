import { describe, it, expect } from 'vitest';
import {
  toOpenAiMessages,
  buildOpenAiRequest,
  stripJsonFences,
  openAiToGemini,
} from '../src/llmProxy';
import type { Env, GenerateRequest } from '../src/types';

const env = {
  LLM_PROXY_URL: 'https://proxy.hoainho.info',
  LLM_PROXY_MODEL: 'big-model',
  LLM_PROXY_MODEL_LITE: 'lite-model',
  LLM_PROXY_JSON_MODE: 'true',
} as Env;

describe('toOpenAiMessages', () => {
  it('maps systemInstruction → system and contents (user/model → user/assistant)', () => {
    const msgs = toOpenAiMessages(
      { role: 'system', parts: [{ text: 'You are Mơ.' }] },
      [
        { role: 'user', parts: [{ text: 'Plan a trip' }] },
        { role: 'model', parts: [{ text: 'Sure' }] },
      ],
    );
    expect(msgs).toEqual([
      { role: 'system', content: 'You are Mơ.' },
      { role: 'user', content: 'Plan a trip' },
      { role: 'assistant', content: 'Sure' },
    ]);
  });

  it('joins multiple parts and skips empty ones; tolerates a single content object', () => {
    const msgs = toOpenAiMessages(undefined, { role: 'user', parts: [{ text: 'a' }, { text: 'b' }] });
    expect(msgs).toEqual([{ role: 'user', content: 'a\nb' }]);
  });
});

describe('buildOpenAiRequest', () => {
  it('maps model, config, and json response_format', () => {
    const req: GenerateRequest = {
      model: 'flash',
      contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192, responseMimeType: 'application/json' },
    };
    const body = buildOpenAiRequest(env, req);
    expect(body.model).toBe('big-model');
    expect(body.temperature).toBe(0.7);
    expect(body.max_tokens).toBe(8192);
    expect(body.response_format).toEqual({ type: 'json_object' });
  });

  it('uses the lite model id for flash-lite', () => {
    const body = buildOpenAiRequest(env, { model: 'flash-lite', contents: [] });
    expect(body.model).toBe('lite-model');
  });

  it('omits response_format when JSON mode is disabled', () => {
    const body = buildOpenAiRequest(
      { ...env, LLM_PROXY_JSON_MODE: 'false' } as Env,
      { model: 'flash', contents: [], generationConfig: { responseMimeType: 'application/json' } },
    );
    expect(body.response_format).toBeUndefined();
  });
});

describe('stripJsonFences', () => {
  it('removes ```json fences', () => {
    expect(stripJsonFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });
  it('removes bare ``` fences', () => {
    expect(stripJsonFences('```\n{"a":1}\n```')).toBe('{"a":1}');
  });
  it('leaves unfenced JSON untouched', () => {
    expect(stripJsonFences('{"a":1}')).toBe('{"a":1}');
  });
});

describe('openAiToGemini', () => {
  it('maps choices[0].message.content + usage into the Gemini shape', () => {
    const out = openAiToGemini({
      choices: [{ message: { content: '```json\n{"destination":"X"}\n```' } }],
      usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 },
    });
    expect(out.candidates?.[0]?.content?.parts?.[0]?.text).toBe('{"destination":"X"}');
    expect(out.usageMetadata).toEqual({
      promptTokenCount: 100,
      candidatesTokenCount: 200,
      totalTokenCount: 300,
    });
  });

  it('defaults to empty text / zero usage on a malformed response', () => {
    const out = openAiToGemini({});
    expect(out.candidates?.[0]?.content?.parts?.[0]?.text).toBe('');
    expect(out.usageMetadata?.totalTokenCount).toBe(0);
  });
});
