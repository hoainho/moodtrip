# Resilient Itinerary Generation

## Why

The core money path (form → Gemini → result) is fragile. A single 8192-token Gemini call must return the
entire nested itinerary JSON or the whole trip fails; for 5–7 day trips this regularly truncates
(`finishReason: MAX_TOKENS`), and the two-attempt retry re-sends an identical prompt so it reproduces the
same truncation. `parseItinerary` validates only 3 top-level fields while `ItineraryDisplay` unconditionally
maps `food` and `tips`, so a model omission crashes the result view — with **no error boundary** around the
display and the bad object **already persisted to localStorage**, trapping the user in a broken state on
every reload. There is no request timeout (a hung proxy = infinite loading), no pre-flight form validation
(degenerate prompts burn rate-limited tokens), and unmapped errors surface raw English technical strings in
the Vietnamese UI. A more robust split-pipeline (`services/itinerarySchemaSplit.ts`) already exists but is
dead code.

## What Changes

- **Adopt structured output**: send Gemini a `responseSchema` for the itinerary, or wire in the existing
  split pipeline (skeleton + enrichment with graceful degradation). Eliminates the truncation→parse-fail→
  render-crash chain. Remove `itinerarySchemaSplit.ts` if the schema approach is chosen.
- **Harden the result contract**: validate `food`, `tips`, and `timeline[].schedule` in `parseItinerary`;
  wrap `ItineraryDisplay` in an error boundary that purges the bad localStorage key; persist to localStorage
  only after a successful mount.
- **Add request timeout + cancel**: `AbortController` (~30–45s) on the proxy `generate()` call that rejects
  into the existing error handling, plus a "Hủy" button on the loading screen.
- **Pre-flight validation + double-submit guard**: require ≥1 mood and budget > 0 with inline messaging;
  disable submit while a generation is in flight.
- **User-facing error mapping**: map all non-known errors to friendly Vietnamese copy (log technical detail
  to console only); honor `retryAfterSeconds` in the rate-limit message; retry `EMPTY_RESPONSE` once;
  preserve `lastFormData` on the result screen so retry-after-error and Anti-Itinerary both work.
- **Prompt-injection delimiting**: fence `personalNote`/`destination` as data, not instructions.

## Impact

- Affected specs: `itinerary-generation` (new capability).
- Affected code: `services/geminiService.ts`, `services/edgeProxyClient.ts`, `services/itinerarySchemaSplit.ts`,
  `App.tsx` (`handleGenerateItinerary`, localStorage persistence, error views), `components/TripForm.tsx`,
  `components/ItineraryDisplay.tsx`, `components/LoadingAnimation.tsx`.
- Risk lane: **high-risk** (primary user path, error/edge handling) → validate:quick + integration + E2E
  (happy + ≥1 error path) + review gate before archive.
- No data-model or API-contract change to the proxy; `responseSchema` is request-side only.
