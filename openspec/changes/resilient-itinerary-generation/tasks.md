# Tasks — Resilient Itinerary Generation

## 1. Structured output
- [ ] 1.1 Define a Gemini `responseSchema` mirroring `ItineraryPlan` (required core + optional arrays)
- [ ] 1.2 Pass `responseSchema` in `callProxyForItinerary` generationConfig
- [ ] 1.3 Verify long-trip (7 day) generation no longer truncates; if it does, gate the split pipeline by `duration.days`
- [ ] 1.4 Remove `services/itinerarySchemaSplit.ts` if unused after 1.3 (or wire it in)

## 2. Result contract + crash isolation
- [ ] 2.1 Extend `parseItinerary` to validate `food`, `tips`, `timeline[].schedule`
- [ ] 2.2 Add `ItineraryErrorBoundary` around `ItineraryDisplay`; on catch → Sentry + purge `ITINERARY_LS_KEY` + recoverable error view
- [ ] 2.3 Move localStorage persistence to fire only after successful mount (not in `handleGenerateItinerary`)
- [ ] 2.4 Keep defensive `?? []` guards in `ItineraryDisplay`

## 3. Timeout + cancel
- [ ] 3.1 Thread an `AbortSignal` through `edgeProxyClient.generate()`
- [ ] 3.2 40s `AbortController` in `geminiService`; map abort → `TIMEOUT`
- [ ] 3.3 `LoadingAnimation` `onCancel` button; `App` aborts in-flight controller and restores form + `lastFormData`
- [ ] 3.4 Guard `setItinerary` on `!signal.aborted`

## 4. Pre-flight validation + double-submit
- [ ] 4.1 `TripForm`: require ≥1 mood (mode-aware) and budget > 0 with inline errors
- [ ] 4.2 `App`: `isGenerating` state; disable submit + no-op Anti-Itinerary path while in flight

## 5. Error mapping
- [ ] 5.1 Central error→VI-copy map; route unmapped errors to generic friendly copy
- [ ] 5.2 Surface `retryAfterSeconds` in rate-limit message
- [ ] 5.3 Retry `EMPTY_RESPONSE` once in the generation loop
- [ ] 5.4 Stop clearing `lastFormData` on success

## 6. Prompt-injection delimiting
- [ ] 6.1 Fence `personalNote`/`destination` as data in both prompt builders

## 7. Validation
- [ ] 7.1 `npm run typecheck` clean
- [ ] 7.2 Unit tests: `parseItinerary` rejects missing `food`/`tips`; error map returns VI copy
- [ ] 7.3 E2E: happy path (existing) + **error path** (mock proxy 500 → friendly message; timeout → recover) + validation block
- [ ] 7.4 Review gate (fresh reviewer) — per-criterion evidence
