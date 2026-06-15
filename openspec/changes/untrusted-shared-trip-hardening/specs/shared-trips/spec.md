# shared-trips

## ADDED Requirements

### Requirement: Schema validation of shared-trip payload
The system SHALL validate the decompressed shared-trip JSON against the `ItineraryPlan` shape before
accepting it as live state. A payload that fails validation SHALL be rejected with a typed error; it SHALL
NOT be cast directly to `ItineraryPlan` or set into application state.

#### Scenario: Attacker-crafted payload with missing timeline is rejected
- **WHEN** a `?trip=` URL contains a compressed JSON object with a missing or null `timeline` field
- **THEN** `decompressItinerary` throws `ShareError('INVALID_SCHEMA')`
- **AND** `App.tsx` renders an error state instead of calling `SharedTripView` with invalid data

#### Scenario: Null schedule inside a day does not crash the render
- **WHEN** a shared-trip payload contains a day entry where `schedule` is absent
- **THEN** the schema validator rejects the payload before `SharedTripView` is mounted
- **AND** no `.map` call is made on an undefined field

#### Scenario: Well-formed shared trip loads normally
- **WHEN** a `?trip=` URL contains a valid, schema-conforming compressed itinerary
- **THEN** the trip loads and renders without error

### Requirement: Decompression byte ceiling
The system SHALL enforce a hard maximum on the total decompressed byte count while reading a
`DecompressionStream`. It SHALL abort the stream and reject the promise if the ceiling is exceeded, before
any parsed object enters the JS heap.

#### Scenario: Decompression bomb is aborted before OOM
- **WHEN** a `?trip=` value decompresses to more than `DECOMPRESS_MAX_BYTES` (2 MB)
- **THEN** the stream reader is cancelled and the promise rejects with `ShareError('PAYLOAD_TOO_LARGE')`
- **AND** the tab does not freeze or exhaust memory

#### Scenario: Normal itinerary is not affected by the ceiling
- **WHEN** a well-formed shared trip decompresses to a size below `DECOMPRESS_MAX_BYTES`
- **THEN** decompression completes normally and the payload proceeds to schema validation

### Requirement: URL length guard with server-share fallback
`generateShareUrl` SHALL measure the encoded inline payload length and, if it exceeds
`SHARE_URL_MAX_INLINE_CHARS`, persist the trip server-side via `ensurePublicTrip` and return a slug URL
instead of a `?trip=` URL.

#### Scenario: Large itinerary uses slug URL
- **WHEN** a user shares a trip whose compressed payload exceeds `SHARE_URL_MAX_INLINE_CHARS` (1 500 chars)
- **THEN** `generateShareUrl` calls `ensurePublicTrip` and returns a `/trip/{slug}` URL
- **AND** the resulting URL does not exceed browser URL length limits

#### Scenario: Small itinerary uses inline URL
- **WHEN** a user shares a trip whose compressed payload is within the threshold
- **THEN** `generateShareUrl` returns a `?trip=` URL without a server round-trip

#### Scenario: Server-share failure surfaces an error
- **WHEN** `ensurePublicTrip` fails (network error or unauthenticated)
- **THEN** `generateShareUrl` rejects with a descriptive error
- **AND** no broken or truncated URL is silently returned to the caller

### Requirement: Safe Uint8Array-to-string conversion
The binary-to-string conversion in `shareService` SHALL NOT spread the full `Uint8Array` as function
arguments. It SHALL use a chunked loop to avoid `RangeError` stack overflow on large arrays.

#### Scenario: Large compressed payload converts without RangeError
- **WHEN** the compressed itinerary exceeds the JS call-stack argument limit
- **THEN** the conversion completes successfully using chunked `String.fromCharCode` calls
- **AND** no `RangeError: Maximum call stack size exceeded` is thrown

### Requirement: URL sanitization for links rendered from shared/AI content
Any URL sourced from itinerary data (activity links, affiliate URLs) SHALL be validated against an allowlist
of safe schemes (`https:`, `http:`) before being rendered as an `<a href>`. Disallowed schemes SHALL be
rejected; the anchor SHALL be omitted or rendered without an `href`.

#### Scenario: javascript: URL in activity link is not rendered
- **WHEN** an itinerary (shared or AI-generated) contains an activity booking URL with a `javascript:` scheme
- **THEN** the link is not rendered as an anchor, or the `href` attribute is omitted
- **AND** no script executes as a result of the user viewing the shared trip

#### Scenario: Valid https URL in activity link renders normally
- **WHEN** an itinerary contains an activity booking URL with an `https:` scheme
- **THEN** the link renders as a normal `<a href>` anchor
