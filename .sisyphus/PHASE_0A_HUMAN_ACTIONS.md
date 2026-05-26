# Phase 0a — Human Actions Required Before Cutover

> All code is in this PR. These steps cannot be done by an AI agent. Complete them before merging or deploying.

## 🔴 Critical (do these first — the old key is already compromised)

### 1. Rotate the leaked Gemini API key
- The literal string `PROXY_API_KEY = 'hoainho'` was in `services/geminiService.ts`. Anyone with read access to the repo (or anyone who ran `view-source` on the deployed site) already has it.
- The Gemini API key behind `proxy.hoainho.info` must also be rotated — assume it has been extracted.
- In Google Cloud Console → APIs & Services → Credentials → revoke the old Gemini key, create a new one with restricted referrer.
- Store the new key as a Cloudflare Worker secret (step 5), never in source.

### 2. Audit git history for other leaked secrets
Run locally before pushing this PR:
```bash
brew install gitleaks  # or: docker run --rm -v $(pwd):/path zricethezav/gitleaks
gitleaks detect --source . --report-format json --report-path /tmp/leaks.json --redact
gitleaks detect --source . --log-opts="--all" --report-format json --report-path /tmp/leaks-history.json --redact
```
Investigate every finding. Rotate every credential that appears.

## 🟡 Required (block production cutover until done)

### 3. Create a Cloudflare account (or use existing)
- Sign up at https://dash.cloudflare.com if you don't have one.
- Add a payment method (the proxy will likely stay on the free Workers tier).

### 4. Install Wrangler and authenticate
```bash
npm install -g wrangler
wrangler login
```

### 5. Create KV namespaces and set secrets
```bash
cd workers/edge-proxy
wrangler kv:namespace create RATE_LIMIT
wrangler kv:namespace create SPEND_TRACKER
# Paste the two returned IDs into wrangler.toml (replacing REPLACE_WITH_KV_ID_FROM_WRANGLER_OUTPUT).

# Set production secrets:
wrangler secret put GEMINI_API_KEY           # <-- the NEW Gemini key from step 1
wrangler secret put JWT_SIGNING_SECRET       # generate via: openssl rand -base64 32
wrangler secret put SUPABASE_JWT_SECRET      # placeholder OK until Phase 0b — set to a random 32-byte value
wrangler secret put INTERNAL_MONITOR_TOKEN   # generate via: openssl rand -base64 32
```

### 6. Deploy the Worker
```bash
cd workers/edge-proxy
wrangler deploy
```
This publishes to `https://moodtrip-edge-proxy.<your-account>.workers.dev`. Note the URL.

### 7. Optional: custom domain (recommended for production)
- In Cloudflare dashboard → Workers & Pages → moodtrip-edge-proxy → Settings → Triggers → add custom domain `api.moodtrip.app`.
- Uncomment the `routes = [...]` line in `wrangler.toml` and re-deploy.

### 8. Wire the frontend
- In Vercel project settings → Environment Variables, set:
  - `VITE_EDGE_PROXY_URL` = the Worker URL from step 6 (or `https://api.moodtrip.app` if step 7 is done)
  - `VITE_SENTRY_DSN` = (optional but recommended) — create a Sentry project at https://sentry.io and paste the DSN here
- Trigger a redeploy of the frontend.

### 9. Verify end-to-end
- Visit the deployed frontend in an incognito window.
- Open devtools → Network. Confirm requests now hit `VITE_EDGE_PROXY_URL/v1/anon-token` then `VITE_EDGE_PROXY_URL/v1/generate` (no longer `proxy.hoainho.info`).
- Generate a trip. It should succeed.
- Try generating again immediately → expect HTTP 429 with code `RATE_LIMIT_EXCEEDED` (anonymous limit = 1/day).

### 10. Backward-compat window for stale clients
- Keep `proxy.hoainho.info` running for 14 days so users with cached PWA bundles don't break.
- After 14 days, point that domain at a single endpoint returning HTTP 410 Gone with a forced-reload header.

## 🟢 Nice-to-have

### 11. Set up Cloudflare alerts
- In Cloudflare dashboard → Workers → set alert when `/v1/spend-status` returns `exceeded: true`.
- Optionally, set up daily Slack/email summary of total spend via `/v1/spend-status?` using the `INTERNAL_MONITOR_TOKEN` from step 5.

### 12. Add GitHub repository secrets for CI
- The `gitleaks` GitHub Action runs as part of the new CI workflow (`.github/workflows/ci.yml`).
- No secrets required for gitleaks itself.
- If you later add Sentry source-map uploads, add `SENTRY_AUTH_TOKEN` as a repo secret.

---

## What this PR ships (code-only)

- `workers/edge-proxy/` — new Cloudflare Worker:
  - `src/index.ts` — Hono app with `/v1/health`, `/v1/anon-token`, `/v1/generate`, `/v1/spend-status`
  - `src/jwt.ts` — anonymous JWT mint + dual Supabase/anon verify
  - `src/rateLimit.ts` — per-tier daily quota in KV
  - `src/spendTracker.ts` — daily $-spend tracking + circuit breaker
  - `src/gemini.ts` — direct Gemini API call (no shared key)
  - `src/crypto.ts` — IP hashing
  - `test/` — 5 test suites covering crypto, rate limit, spend tracker, JWT round-trip, full integration
- `services/edgeProxyClient.ts` — new client that mints anon JWT, caches it in LocalStorage, retries on 401
- `services/geminiService.ts` — refactored to call new edge proxy (removed hardcoded `proxy.hoainho.info` + `PROXY_API_KEY = 'hoainho'`)
- `services/sentry.ts` — Sentry init with PII scrubbing
- `services/__tests__/edgeProxyClient.test.ts` — 8 unit/integration tests for the client
- `App.tsx` — surface BUDGET_EXCEEDED + clearer RATE_LIMIT_EXCEEDED user messages
- `index.tsx` — wire `initSentry()` at boot
- `.gitleaks.toml` + `.github/workflows/ci.yml` — CI with gitleaks, typecheck, both test suites, build
- `vitest.config.ts` — client test runner config
- `package.json` — add Vitest + happy-dom + @sentry/react devDeps; add test scripts

## Risks managed by this PR

- ✅ Hardcoded shared proxy key removed from source
- ✅ Per-tier daily rate limits enforced server-side
- ✅ Daily $-spend circuit breaker (default $80) prevents cost runaway
- ✅ Anonymous-token rotation on 401 (handles 15-min JWT expiry transparently)
- ✅ CI blocks future secret leaks via gitleaks
- ✅ Sentry initialized with PII scrubbing
- ✅ Existing trip-generation flow regression-tested via 8 client tests + 8 worker integration tests
