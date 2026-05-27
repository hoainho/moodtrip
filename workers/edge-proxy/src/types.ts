export interface Env {
  RATE_LIMIT: KVNamespace;
  SPEND_TRACKER: KVNamespace;

  GEMINI_API_KEY: string;
  JWT_SIGNING_SECRET: string;
  SUPABASE_JWT_SECRET: string;
  INTERNAL_MONITOR_TOKEN: string;

  ALLOWED_ORIGINS: string;
  GEMINI_MODEL: string;
  GEMINI_MODEL_LITE: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  DAILY_SPEND_LIMIT_USD: string;
  ANON_DAILY_LIMIT: string;
  FREE_DAILY_LIMIT: string;
  PAID_DAILY_LIMIT: string;
  JWT_ISSUER: string;
  JWT_AUDIENCE: string;

  GEMINI_FLASH_INPUT_USD_PER_MTOK: string;
  GEMINI_FLASH_OUTPUT_USD_PER_MTOK: string;
  GEMINI_FLASH_LITE_INPUT_USD_PER_MTOK: string;
  GEMINI_FLASH_LITE_OUTPUT_USD_PER_MTOK: string;
}

export type Tier = 'anonymous' | 'free' | 'paid';

export interface AnonClaims {
  sub: string;
  tier: 'anonymous';
  ipHash: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface SupabaseClaims {
  sub: string;
  email?: string;
  role: string;
  tier?: 'free' | 'paid';
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export type Claims = AnonClaims | SupabaseClaims;

export interface GenerateRequest {
  model?: 'flash' | 'flash-lite';
  contents: unknown;
  generationConfig?: Record<string, unknown>;
  systemInstruction?: unknown;
}

export interface GenerateResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

export interface ApiError {
  error: string;
  code: string;
  retryAfterSeconds?: number;
}
