# Design — Untrusted Shared-Trip Hardening

## Decision 1: Schema validation strategy

`decompressItinerary` (`services/shareService.ts:81`) currently returns `JSON.parse(json) as ItineraryPlan`
with no runtime check. Two options:

- **A. Inline structural guard (recommended).** After `JSON.parse`, run a lightweight validator that checks
  the presence and type of every field `SharedTripView` consumes: `destination` (string), `overview`
  (string), `timeline` (non-empty array, each element with a `schedule` array), `food` (array), `tips`
  (array). Throw a typed `ShareError('INVALID_SCHEMA')` on mismatch. Reuse or align with the `parseItinerary`
  guard from the `resilient-itinerary-generation` change if it lands first.
- **B. JSON Schema / Zod library.** More exhaustive but adds a dependency and bundle weight for a single
  callsite.

**Choice:** A. The validator lives in `shareService.ts` next to the parse call and stays aligned with
`ItineraryPlan`. `App.tsx:160-167` catches `ShareError('INVALID_SCHEMA')` and renders a "link inválido"
error state rather than setting broken state live.

## Decision 2: Decompression byte ceiling

The `DecompressionStream` pipeline (`services/shareService.ts:46-81`) pumps all chunks into a concatenated
string with no limit. The fix accumulates chunk byte counts and aborts the `ReadableStream` reader the moment
the total exceeds a ceiling constant (export as `DECOMPRESS_MAX_BYTES = 2 * 1024 * 1024` — 2 MB, well above
any real itinerary). On abort, reject with `ShareError('PAYLOAD_TOO_LARGE')`. This check runs before
`JSON.parse`, so a bomb never enters the JS heap as a parsed object.

## Decision 3: URL length guard and server-share fallback

`generateShareUrl` (`services/shareService.ts:87-92`) should measure `encodeURIComponent(compressed).length`
after compression. If it exceeds `SHARE_URL_MAX_INLINE_CHARS = 1500`, call `ensurePublicTrip` from
`services/tripsApi.ts` to persist the trip server-side and return a slug URL (`/trip/{slug}`) instead of a
`?trip=` URL. This keeps short trips as fast client-side-only shares while routing large trips through the
existing server path. No new API surface needed.

## Decision 4: Chunked Uint8Array-to-string conversion

`String.fromCharCode(...compressed)` (`services/shareService.ts:35`) spreads the entire `Uint8Array` as
function arguments. Replace with a `CHUNK = 8192` loop:

```ts
const CHUNK = 8192;
let binary = '';
for (let i = 0; i < compressed.length; i += CHUNK) {
  binary += String.fromCharCode(...compressed.subarray(i, i + CHUNK));
}
```

This is a pure correctness fix; no behaviour change for small arrays.

## Decision 5: URL sanitization for rendered links

Itinerary text fields (activity booking links, affiliate URLs in `services/affiliate.ts`) are AI-generated or
attacker-supplied in the shared-trip case. Before any value is rendered as `<a href>`:

- Allow only `https:` and `http:` schemes; strip or replace anything else (e.g. `javascript:`, `data:`).
- A single `sanitizeUrl(url: string): string | null` helper returns `null` for disallowed schemes; the render
  site omits the `href` or the anchor entirely when `null`.
- Document the trust boundary in a code comment at the `SharedTripView` render site: shared-trip data is
  untrusted input from an external URL parameter.

## Risks

- The 2 MB ceiling must be validated against the largest real itinerary in production — if 7-day trips with
  images exceed this, raise the ceiling before shipping.
- `ensurePublicTrip` may fail (network error, unauthenticated user); `generateShareUrl` must handle this
  gracefully and surface a copy-friendly error rather than silently producing a broken long URL.
- Schema validator must stay in sync with `ItineraryPlan` type changes; consider a compile-time check or
  shared constant to enforce alignment.
