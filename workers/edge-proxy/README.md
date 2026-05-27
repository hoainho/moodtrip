# MoodTrip Edge Proxy (Cloudflare Worker)

Phase 0a ship-stop security infrastructure. Replaces the hardcoded shared-key proxy at
`proxy.hoainho.info` (compromised — see Oracle/Metis reviews).

## What this Worker does

1. **AI proxy** — accepts authenticated requests from the MoodTrip frontend, forwards to Google Gemini.
2. **Anonymous JWT minting** — clients with no Supabase session get a short-lived JWT bound to a hashed IP.
3. **Rate limiting** — per-tier daily quotas enforced via Workers KV.
4. **Daily $-spend circuit breaker** — if total Gemini cost today exceeds `DAILY_SPEND_LIMIT_USD`, generation is paused for everyone.
5. **Origin validation** — only accepts requests from allowed origins (moodtrip.app + local dev).

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/v1/anon-token` | Origin only | Mint anonymous 15-minute JWT |
| `POST` | `/v1/generate` | JWT (anon or Supabase) | Generate itinerary via Gemini |
| `GET`  | `/v1/health` | Public | Health check |
| `GET`  | `/v1/spend-status` | Internal token | Today's $-spend (for monitoring) |

## Rate limits

| Tier | Daily generate calls | How identified |
|---|---|---|
| Anonymous | 1 | Anonymous JWT bound to IP-hash |
| Free (Supabase authed) | 3 | Supabase user_id |
| Paid (Phase 3) | 50 | Supabase user_id + `paid_plan` claim |

## $-spend circuit breaker

- Each successful Gemini call increments a daily counter in KV with the estimated cost
  (input + output tokens × Gemini 2.5 Flash pricing).
- When today's total crosses `DAILY_SPEND_LIMIT_USD` (default $80), `/v1/generate` returns
  `503 Service Unavailable` with code `BUDGET_EXCEEDED` for the rest of the day.
- Counter resets at UTC 00:00.

## 🔴 HUMAN ACTION REQUIRED (before this Worker is useful)

1. **Create a Cloudflare account** (or use existing).
2. **Install Wrangler locally:** `npm install -g wrangler` then `wrangler login`.
3. **Create the KV namespace:**
   ```bash
   wrangler kv:namespace create RATE_LIMIT
   wrangler kv:namespace create SPEND_TRACKER
   ```
   Paste the returned IDs into `wrangler.toml`.
4. **Set Worker secrets** (NEVER commit these):
   ```bash
   wrangler secret put GEMINI_API_KEY        # <-- NEW key, ROTATE the old one
   wrangler secret put JWT_SIGNING_SECRET    # generate via: openssl rand -base64 32
   wrangler secret put SUPABASE_JWT_SECRET   # from Supabase dashboard → Settings → API → JWT Secret (after Phase 0b)
   wrangler secret put INTERNAL_MONITOR_TOKEN # generate via: openssl rand -base64 32
   ```
5. **Deploy:** `wrangler deploy` (publishes to `<your-worker-name>.workers.dev` or your custom domain).
6. **Update frontend env** — set `VITE_EDGE_PROXY_URL` in Vercel to the deployed Worker URL.
7. **Rotate the leaked Gemini API key in Google Cloud Console** — the old key is compromised by being committed.
8. **Keep `proxy.hoainho.info` running for 14 days** as a backward-compat layer for users on stale PWA caches.

## Local development

```bash
cd workers/edge-proxy
npm install
cp .dev.vars.example .dev.vars
# fill in dev secrets
wrangler dev
```

## Testing

```bash
npm test          # unit + integration via Vitest + miniflare
```

Run from repo root: `npm run test:worker`
