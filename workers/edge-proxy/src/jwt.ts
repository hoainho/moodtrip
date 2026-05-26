import { SignJWT, jwtVerify } from 'jose';
import type { AnonClaims, Claims, Env, SupabaseClaims } from './types';
import { randomNonce } from './crypto';

const ANON_TOKEN_TTL_SECONDS = 15 * 60;

function getSecret(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function mintAnonToken(
  env: Env,
  ipHash: string,
): Promise<{ token: string; expiresIn: number }> {
  const now = Math.floor(Date.now() / 1000);
  const sub = `anon:${ipHash}:${randomNonce(8)}`;

  const token = await new SignJWT({
    tier: 'anonymous' as const,
    ipHash,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(sub)
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(now + ANON_TOKEN_TTL_SECONDS)
    .sign(getSecret(env.JWT_SIGNING_SECRET));

  return { token, expiresIn: ANON_TOKEN_TTL_SECONDS };
}

export async function verifyToken(env: Env, token: string): Promise<Claims> {
  const anonResult = await tryVerify<AnonClaims>(token, env.JWT_SIGNING_SECRET, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });
  if (anonResult) return anonResult;

  const supaResult = await tryVerify<SupabaseClaims>(token, env.SUPABASE_JWT_SECRET, {
    audience: 'authenticated',
  });
  if (supaResult) return supaResult;

  throw new Error('Invalid token');
}

async function tryVerify<T>(
  token: string,
  secret: string,
  opts: { issuer?: string; audience?: string },
): Promise<T | null> {
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(secret), opts);
    return payload as unknown as T;
  } catch {
    return null;
  }
}

export function isAnonClaims(claims: Claims): claims is AnonClaims {
  return (claims as AnonClaims).tier === 'anonymous';
}
