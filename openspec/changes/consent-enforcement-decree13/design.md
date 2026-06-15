# Design — Consent Enforcement — Decree 13

## Decision 1: Consent banner — refuse and manage-choices paths

`ConsentBanner.tsx:38-60` currently renders a single "Tôi đồng ý" button. Two options:

- **A. Inline two-button layout (recommended).** Add "Từ chối" beside "Tôi đồng ý" and a tertiary
  "Tuỳ chọn" link that expands an in-banner scope checklist. Refusing sets all non-essential scopes to
  `false` in `consentService` and dismisses the banner. The component stays self-contained.
- **B. Full preference modal.** Open a separate `ConsentModal` component. More surface area for granular
  control but introduces a new component and a routing dependency for the manage-preferences page.

**Choice:** A as the primary path — fewest moving parts, meets the legal bar (freely given, refusable,
specific). Wire "Tuỳ chọn" to expand an inline scope list. If product later needs a settings page, the
scope list can be extracted without touching the banner logic.

## Decision 2: Consent-gated analytics and cross-border calls

`services/analytics.ts:21-34` must not call `ensurePosthog` or `capture_pageview` without a prior
`hasConsented('analytics_anonymous')` check. Pattern:

```ts
// analytics.ts
export function trackEvent(event: string, props?: Record<string, unknown>) {
  if (!hasConsented('analytics_anonymous')) return;
  ensurePosthog();
  posthog.capture(event, props);
}
```

`services/edgeProxyClient.ts` `generate()` must check `hasConsented('ai_generation_cross_border')` and
throw a typed `ConsentError('CROSS_BORDER_CONSENT_REQUIRED')` if absent. The caller (`geminiService` or
`App`) maps this to a friendly Vietnamese message and shows the banner or a consent prompt — no silent
data transmission.

`services/consent.ts` `hasConsented` is already implemented; no new abstraction is needed. The change is
purely call-site gating.

## Decision 3: Jurisdiction capture on consent log

`services/consent.ts:60-67` inserts into `consent_log` without `ip_country`. The column exists in the
migration. Options:

- **A. Edge-function header (recommended).** In the Supabase edge function (or a thin API route) that
  receives consent events, read `x-forwarded-for` / Cloudflare `CF-IPCountry` header and write it to the
  insert. Keeps PII off the client.
- **B. Client-side IP lookup.** Call an IP-geo API from the browser. Adds a network round-trip, leaks the
  lookup to a third party, and is trivially spoofable.

**Choice:** A. If a direct-to-DB client call is the current pattern, add a minimal edge function wrapper
for consent logging so the server can inject the header. This is the only server-side write path for
`consent_log`; the wrapper stays small.

## Decision 4: Erasure — RLS posture in delete-account function

`supabase/functions/delete-account/index.ts:49-51` creates the user-context client using the SERVICE-ROLE
key. The service-role client bypasses all RLS policies, meaning a compromised JWT or SSRF could delete
arbitrary rows. The function already creates a service-role admin client around line 61.

Fix: create the user-context client with the anon key + user JWT:

```ts
const userClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: { headers: { Authorization: `Bearer ${jwt}` } },
});
```

Reserve `adminClient` (service-role) exclusively for the `auth.admin.deleteUser` call, which requires it.
All RLS-protected row operations (read-before-delete checks, preference deletes, trip deletes if not
cascaded) use `userClient`.

## Decision 5: Erasure integrity — audit identity and cascade verification

Two sub-problems:

**5a. Audit-log orphan.** `audit_log.actor_id` is a FK to `auth.users` with `on delete set null`. When
`deleteUser` fires, the audit row that records the deletion loses its `actor_id`. Fix: before calling
`deleteUser`, write the user's `id` (and optionally `email`) as a text field into `audit_log.metadata`
(JSONB). The FK may remain for non-deletion audit rows; the text copy in metadata is the durable record.
No schema change needed — `metadata` column already exists.

**5b. Consent-log retention.** `consent_log.user_id` is also a FK. Options:
- Delete the rows (forget): simple, consistent with erasure.
- Anonymise (null user_id, retain timestamps and scopes): supports aggregate compliance reporting.

**Choice:** Delete consent rows as part of the erasure transaction. Add an explicit `DELETE FROM consent_log
WHERE user_id = $1` step before `deleteUser`. Document the choice here as the authoritative record.

**5c. Cascade verification.** Confirm `trips` and `user_preferences` have `on delete cascade` on their
`user_id` FK. If not, add a migration. Add a post-deletion audit assertion (count = 0) in the edge
function.

## Decision 6: Complete portability export

`services/dataExport.ts:31-34` uses a single query with an implicit 1 000-row Supabase limit and returns
`[]` on any error. Fix with a pagination loop:

```ts
let page = 0;
const PAGE_SIZE = 1000;
const trips: Trip[] = [];
while (true) {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', userId)
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
  if (error) throw new ExportError(error.message);
  trips.push(...(data ?? []));
  if ((data?.length ?? 0) < PAGE_SIZE) break;
  page++;
}
```

Propagate the `ExportError` to the caller rather than swallowing it. The UI must distinguish "export
succeeded (0 trips)" from "export failed" and surface the latter.

## Risks

- Consent-gating `generate()` means users who decline cross-border consent cannot use the core feature.
  The UI must communicate this clearly without dark-pattern pressure.
- Audit-log metadata write must be transactional with the deletion — if the metadata write fails, abort
  the entire erasure so the audit trail is never silently incomplete.
- Pagination loop in `dataExport.ts` could run indefinitely for a malformed DB response; add a max-page
  guard (e.g., 100 pages = 100 000 trips) with a thrown error.
