# Untrusted Shared-Trip Hardening

## Why

The shared-trip link feature (`?trip=` query parameter) accepts attacker-controlled, compressed JSON and
feeds it directly into the live itinerary state with no validation. The entire attack surface is pre-auth and
victim-clickable — no login required. Four concrete issues exist today:

- `services/shareService.ts:81` casts decompressed output as `ItineraryPlan` with a bare `JSON.parse(json) as
  ItineraryPlan`. The `?trip=` value is fully attacker-controlled; `App.tsx:160-167` sets the cast object live;
  `components/SharedTripView.tsx:89-103` then calls `trip.itinerary.timeline.map` and `day.schedule.map`
  unconditionally — a null or missing field crashes the render immediately. Arbitrary attacker-supplied URLs
  flow into the UI via affiliate/activity links with no sanitization.
- `services/shareService.ts:46-81` pipes `DecompressionStream` output into memory with no byte ceiling. A
  small `?trip=` value (zip bomb) can expand to hundreds of MB and freeze or OOM-kill the tab before any
  parsing occurs — with zero user interaction beyond clicking a link.
- `services/shareService.ts:87-92` `generateShareUrl` applies no length guard. Large itineraries produce URLs
  that exceed browser/server limits (HTTP 414 or silent truncation), delivering a corrupt share to recipients.
- `services/shareService.ts:35` uses `String.fromCharCode(...compressed)` with a spread over a full
  `Uint8Array`. On large arrays this exceeds the call-stack argument limit and throws a `RangeError`.

Together these allow an attacker to crash any victim's browser tab, deliver a decompression bomb, or inject
arbitrary content into the shared-trip view — all via a single crafted URL.

## What Changes

- **Schema validation on decompressed output**: after `JSON.parse`, validate the result against the
  `ItineraryPlan` shape before assigning it to state. Reject (throw) on schema mismatch. This closes the
  blind-cast and eliminates crash-on-render for malformed or attacker-crafted payloads.
- **Decompression byte ceiling**: enforce a hard max (e.g. 2 MB) while accumulating `DecompressionStream`
  chunks; abort the stream and reject the promise the moment the ceiling is breached. Prevents decompression
  bombs from ever fully materialising in memory.
- **URL length guard in `generateShareUrl`**: if the compressed + encoded string exceeds a safe threshold
  (~1 500 chars), fall back to a slug-based server share via `ensurePublicTrip`/`tripsApi` rather than
  embedding the payload inline.
- **Chunked `Uint8Array` → string conversion**: replace `String.fromCharCode(...compressed)` with a loop
  over fixed-size chunks to avoid the `RangeError` stack overflow.
- **URL/HTML sanitization for rendered links**: whitelist-validate any URL sourced from itinerary text fields
  (activity links, affiliate URLs) before rendering as `<a href>`. Document the trust boundary between
  shared/AI content and rendered HTML.

## Impact

- Affected specs: `shared-trips` (new capability).
- Affected code: `services/shareService.ts` (decompression, URL generation, Uint8Array conversion),
  `App.tsx` (shared-trip load effect `App.tsx:160-167`), `components/SharedTripView.tsx` (render guard),
  `services/tripsApi.ts` (slug-based share fallback), `services/affiliate.ts` (URL sanitization callsite).
- Risk lane: **high-risk** (security, pre-auth attacker-controlled input) → E2E + review gate before archive.
- No user-visible behaviour changes for well-formed share links; malformed links surface a clear error state
  instead of a crash.
