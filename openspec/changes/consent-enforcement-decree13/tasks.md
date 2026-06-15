# Tasks — Consent Enforcement — Decree 13

## 1. Refusable consent banner (components/ConsentBanner.tsx:38-60)
- [ ] 1.1 Add "Từ chối" button alongside "Tôi đồng ý"; on click set all non-essential scopes to `false` in `consentService` and dismiss banner
- [ ] 1.2 Add "Tuỳ chọn" tertiary action; on click expand inline scope checklist (analytics_anonymous, ai_generation_cross_border) with individual toggles
- [ ] 1.3 Add "Lưu tuỳ chọn" action on the expanded checklist that saves the partial selection and dismisses
- [ ] 1.4 Ensure no analytics or cross-border calls fire while the banner is pending an explicit user action

## 2. Consent-gated analytics (services/analytics.ts:21-34)
- [ ] 2.1 Wrap `ensurePosthog` call with `hasConsented('analytics_anonymous')` guard; skip initialisation and return early if absent
- [ ] 2.2 Gate every `trackEvent` / `posthog.capture` call site on `hasConsented('analytics_anonymous')` — no unconditional `capture_pageview`
- [ ] 2.3 Verify `services/consent.ts` `hasConsented` is correctly imported and available at both call sites

## 3. Consent-gated cross-border generation (services/edgeProxyClient.ts)
- [ ] 3.1 At the top of `generate()`, call `hasConsented('ai_generation_cross_border')`; if false, throw `new ConsentError('CROSS_BORDER_CONSENT_REQUIRED')`
- [ ] 3.2 Define `ConsentError` class (or reuse an existing typed error) in `services/consent.ts` or a shared errors file
- [ ] 3.3 Map `CROSS_BORDER_CONSENT_REQUIRED` in the caller error handler to a friendly Vietnamese message and a consent CTA

## 4. Jurisdiction capture on consent log (services/consent.ts:60-67)
- [ ] 4.1 Introduce a thin server-side route or Supabase edge function to receive consent events; read `CF-IPCountry` or `x-forwarded-for` header and inject as `ip_country`
- [ ] 4.2 Update the `consent_log` insert in `services/consent.ts` to pass `ip_country` received from the server; remove any client-side country derivation
- [ ] 4.3 Confirm the `consent_log.ip_country` column exists in the migration; add a migration if absent

## 5. Erasure — RLS fix (supabase/functions/delete-account/index.ts:49-51)
- [ ] 5.1 Replace the service-role key in the user-context client constructor (~line 49-51) with `supabaseAnonKey` + `Authorization: Bearer ${jwt}` header
- [ ] 5.2 Confirm all user-scoped row operations (trips, preferences, consent_log reads/deletes) use the new user-context client
- [ ] 5.3 Confirm `adminClient` (service-role, ~line 61) is used only for `auth.admin.deleteUser`

## 6. Erasure integrity — audit identity (supabase/functions/delete-account/index.ts, audit_log)
- [ ] 6.1 Before calling `auth.admin.deleteUser`, write `{ actor_id: userId, actor_email: userEmail }` into `audit_log.metadata` for the deletion event row
- [ ] 6.2 Wrap the metadata write in error handling; abort the entire erasure and surface the error if the write fails
- [ ] 6.3 Verify `audit_log.metadata` is JSONB and can accept the text identity fields; add a migration if the column type needs adjustment

## 7. Erasure integrity — consent-log cleanup and cascade (supabase/functions/delete-account/index.ts, migrations)
- [ ] 7.1 Add explicit `DELETE FROM consent_log WHERE user_id = $userId` step in the erasure flow, executed before `deleteUser`
- [ ] 7.2 Verify `trips.user_id` FK has `ON DELETE CASCADE`; add migration if missing
- [ ] 7.3 Verify `user_preferences.user_id` FK has `ON DELETE CASCADE`; add migration if missing
- [ ] 7.4 Add a post-deletion assertion in the edge function: query `trips` and `user_preferences` count for the deleted user_id and log/error if non-zero

## 8. Complete portability export (services/dataExport.ts:31-34)
- [ ] 8.1 Replace single-query fetch with a `while` pagination loop using `.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)` and `PAGE_SIZE = 1000`
- [ ] 8.2 On any page fetch error, throw `ExportError` with the Supabase error message; remove silent `[]` fallback
- [ ] 8.3 Add a max-page guard (e.g. 100 pages) that throws `ExportError('TOO_MANY_PAGES')` to prevent an infinite loop on malformed responses
- [ ] 8.4 Update the export caller to distinguish "0 trips" (success) from thrown `ExportError` (failure) and surface the failure state in the UI

## 9. Validation
- [ ] 9.1 `npm run typecheck` clean across all modified files
- [ ] 9.2 Unit tests: consent banner renders "Từ chối" and "Tuỳ chọn"; `trackEvent` no-ops without consent; `generate()` throws `ConsentError` without cross-border consent; `dataExport` paginates and throws on error
- [ ] 9.3 Integration: delete-account edge function uses anon-key client for row ops; audit_log metadata contains actor identity after deletion; consent_log rows absent after deletion
- [ ] 9.4 E2E: full erasure flow (accept → generate → delete account) verifies no data remains; export flow for > 1 000 rows returns complete set
- [ ] 9.5 Review gate (compliance-aware reviewer) — verify each Decree 13 requirement has evidence of enforcement
