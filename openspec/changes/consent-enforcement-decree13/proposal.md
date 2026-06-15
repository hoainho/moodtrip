# Consent Enforcement — Decree 13

## Why

Vietnam's Nghị định 13/2023/NĐ-CP (Decree 13) imposes binding obligations on personal-data controllers:
consent must be freely given, specific, and refusable (Art. 11); data subjects have the right to access and
erase their data (Art. 9); cross-border transfers require explicit, scope-scoped consent (Art. 25); and
portability exports must be complete and accurate (Art. 11). The current codebase fails every one of these
requirements:

- `components/ConsentBanner.tsx:38-60` renders only "Tôi đồng ý" — there is no decline or manage-choices
  path. A banner that cannot be refused does not constitute valid consent under Decree 13.
- `services/analytics.ts:21-34` calls `ensurePosthog` and fires `capture_pageview` unconditionally, before
  any consent check. `services/edgeProxyClient.ts` sends user data cross-border on every `generate()` call
  without verifying the `ai_generation_cross_border` scope. `services/consent.ts` records scopes but nothing
  gates actual data transmission on them.
- `services/consent.ts:60-67` omits `ip_country` from the consent-log insert even though the `consent_log`
  table carries the column — cross-border accountability records are incomplete.
- `supabase/functions/delete-account/index.ts:49-51` builds the user-context Supabase client with the
  SERVICE-ROLE key, bypassing Row-Level Security on every erasure call.
- `audit_log.actor_id` and `consent_log.user_id` are foreign keys with `on delete set null`. The moment
  `deleteUser` runs, the deletion audit row is orphaned — the compliance record that proves erasure occurred
  loses the identity it is supposed to record. Trip and preference rows have no verified cascade.
- `services/dataExport.ts:31-34` silently caps at 1 000 trip rows and swallows fetch errors, presenting an
  incomplete export as complete — a direct breach of the portability right.

## What Changes

- **Refusable consent banner**: add "Từ chối" and "Tuỳ chọn" (manage choices) actions to
  `ConsentBanner.tsx`; refusing must be as frictionless as accepting; if the user declines, non-essential
  data flows are blocked before they start.
- **Consent-gated telemetry and cross-border calls**: gate `ensurePosthog`/`trackEvent` on
  `hasConsented('analytics_anonymous')`; gate `edgeProxyClient.generate()` on
  `hasConsented('ai_generation_cross_border')`; surface a graceful UI state when cross-border consent is
  absent.
- **Jurisdiction capture on consent log**: populate `ip_country` server-side (edge function or
  `x-forwarded-for` header) when recording consent events.
- **Erasure path — RLS fix**: use the anon key (user JWT) for the user-context client in
  `delete-account/index.ts`; reserve the service-role client (already present) only for the privileged
  admin-only steps.
- **Erasure integrity — audit identity**: store `actor_id` as immutable text in `audit_log.metadata` before
  the user row is deleted so the audit record survives the cascade; decide explicitly on consent-log
  retention (delete vs. anonymise); verify trips and user-preferences cascade correctly.
- **Complete portability export**: paginate `dataExport.ts` with a range loop until all rows are fetched;
  propagate fetch errors instead of returning `[]`.

## Impact

- Affected specs: `consent-compliance` (new capability).
- Affected code: `components/ConsentBanner.tsx`, `services/consent.ts`, `services/analytics.ts`,
  `services/edgeProxyClient.ts`, `services/dataExport.ts`,
  `supabase/functions/delete-account/index.ts`, Supabase migrations (`consent_log`, `audit_log`,
  `trips`, `user_preferences`).
- Risk lane: **high-risk** (compliance + auth/data deletion) → validate:quick + integration + review gate
  before archive.
- No public API contract change; all changes are server-side RLS posture, client-side consent guards, and
  DB-migration level column/FK adjustments.
