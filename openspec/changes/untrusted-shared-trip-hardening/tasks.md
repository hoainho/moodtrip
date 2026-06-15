# Tasks — Untrusted Shared-Trip Hardening

## 1. Schema validation
- [ ] 1.1 Write a `validateSharedItinerary(obj: unknown): ItineraryPlan` function in `services/shareService.ts` that checks presence and type of `destination`, `overview`, non-empty `timeline[]` (each with `schedule[]`), `food[]`, `tips[]`; throws `ShareError('INVALID_SCHEMA')` on mismatch
- [ ] 1.2 Replace `JSON.parse(json) as ItineraryPlan` at `shareService.ts:81` with `validateSharedItinerary(JSON.parse(json))`
- [ ] 1.3 Catch `ShareError('INVALID_SCHEMA')` in `App.tsx:160-167` shared-trip load effect and render an error state instead of setting live itinerary state

## 2. Decompression byte ceiling
- [ ] 2.1 Export `DECOMPRESS_MAX_BYTES = 2 * 1024 * 1024` constant in `services/shareService.ts`
- [ ] 2.2 Accumulate chunk byte lengths in the `DecompressionStream` reader loop (`shareService.ts:46-81`); cancel the reader and reject with `ShareError('PAYLOAD_TOO_LARGE')` the moment the running total exceeds `DECOMPRESS_MAX_BYTES`
- [ ] 2.3 Catch `ShareError('PAYLOAD_TOO_LARGE')` in `App.tsx` shared-trip load effect and surface a user-facing error

## 3. URL length guard and server-share fallback
- [ ] 3.1 Export `SHARE_URL_MAX_INLINE_CHARS = 1500` constant in `services/shareService.ts`
- [ ] 3.2 In `generateShareUrl` (`shareService.ts:87-92`), measure `encodeURIComponent(compressed).length`; if it exceeds the threshold, call `ensurePublicTrip` from `services/tripsApi.ts` and return the resulting slug URL
- [ ] 3.3 Handle `ensurePublicTrip` failure in `generateShareUrl` by rejecting with a descriptive error (do not return a truncated inline URL)

## 4. Chunked Uint8Array-to-string conversion
- [ ] 4.1 Replace `String.fromCharCode(...compressed)` at `shareService.ts:35` with a `CHUNK = 8192` loop over `compressed.subarray(i, i + CHUNK)`

## 5. URL sanitization for rendered links
- [ ] 5.1 Add a `sanitizeUrl(url: string): string | null` helper (allow `https:` and `http:` only; return `null` for all other schemes)
- [ ] 5.2 Apply `sanitizeUrl` at every callsite in `services/affiliate.ts` and `components/SharedTripView.tsx` that renders a URL as `<a href>`; omit the anchor or `href` when `sanitizeUrl` returns `null`
- [ ] 5.3 Add a code comment at the `SharedTripView` render site documenting the trust boundary: shared-trip data is untrusted attacker-controlled input

## 6. Validation
- [ ] 6.1 `npm run typecheck` clean across all modified files
- [ ] 6.2 Unit tests: `validateSharedItinerary` rejects payloads with missing `timeline`, null `schedule`, and wrong types; `sanitizeUrl` blocks `javascript:` and `data:` schemes; chunked conversion matches reference output
- [ ] 6.3 E2E: valid `?trip=` URL loads correctly; crafted payload with missing fields renders error state (not crash); oversized payload rejected before parse; `javascript:` href not present in rendered DOM
- [ ] 6.4 Manual test: generate a 7-day trip, share it, verify slug URL is produced and loads on a fresh tab
- [ ] 6.5 Review gate (security-focused reviewer) — verify each finding from `shareService.ts` is addressed with evidence
