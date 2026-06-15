# consent-compliance

## ADDED Requirements

### Requirement: Refusable consent banner
The consent banner SHALL present an explicit decline action ("Từ chối") and a manage-choices action
("Tuỳ chọn") with equal visual prominence to the accept action, so that consent is freely given and
refusable as required by Decree 13 Art. 11.

#### Scenario: User can decline all non-essential consent
- **WHEN** the consent banner is displayed
- **THEN** a "Từ chối" button is present alongside "Tôi đồng ý"
- **AND** clicking "Từ chối" records all non-essential scopes as `false` in `consentService` and dismisses the banner without further friction

#### Scenario: User can manage individual consent scopes
- **WHEN** the user clicks "Tuỳ chọn" on the consent banner
- **THEN** an inline scope checklist is revealed showing each consent scope (analytics_anonymous, ai_generation_cross_border) with individual toggles
- **AND** the user can save a partial consent selection that is honoured by all downstream data flows

#### Scenario: Banner cannot be bypassed without an explicit choice
- **WHEN** the consent banner is rendered
- **THEN** no essential analytics or cross-border calls are made until the user has taken an explicit action (accept, decline, or save custom choices)

### Requirement: Consent-gated analytics telemetry
PostHog initialisation and all `trackEvent` calls SHALL be gated on `hasConsented('analytics_anonymous')`
so that no analytics data is transmitted without valid consent.

#### Scenario: Analytics not initialised without consent
- **WHEN** a user has not granted `analytics_anonymous` consent
- **THEN** `ensurePosthog` is not called and no PostHog events are sent for that session

#### Scenario: Analytics activate after consent is granted
- **WHEN** a user grants `analytics_anonymous` consent
- **THEN** PostHog initialises and `capture_pageview` fires for the current page

#### Scenario: Analytics suppressed after consent is withdrawn
- **WHEN** a user revokes `analytics_anonymous` consent
- **THEN** subsequent `trackEvent` calls are no-ops for the remainder of the session

### Requirement: Consent-gated cross-border AI generation
`edgeProxyClient.generate()` SHALL check `hasConsented('ai_generation_cross_border')` before transmitting
user data to the external AI proxy, and SHALL surface a typed error if consent is absent.

#### Scenario: Generation blocked without cross-border consent
- **WHEN** a user has not granted `ai_generation_cross_border` consent and triggers itinerary generation
- **THEN** `generate()` throws `ConsentError('CROSS_BORDER_CONSENT_REQUIRED')` and no request is sent to the proxy
- **AND** the UI displays a friendly Vietnamese message explaining that cross-border consent is required and offers a path to grant it

#### Scenario: Generation proceeds with cross-border consent
- **WHEN** a user has granted `ai_generation_cross_border` consent
- **THEN** `generate()` proceeds normally without additional prompts

### Requirement: Jurisdiction capture on consent log
Every consent event recorded in `consent_log` SHALL include the `ip_country` value derived server-side so
that cross-border accountability records are complete.

#### Scenario: Consent log row includes ip_country
- **WHEN** a consent event is recorded (accept, decline, or scope change)
- **THEN** the `consent_log` row has a non-null `ip_country` value populated from the server-side request context
- **AND** no client-supplied country value is trusted for this field

### Requirement: Erasure path uses least-privilege client
The `delete-account` edge function SHALL build the user-context Supabase client with the anon key and the
user's JWT, reserving the service-role client exclusively for `auth.admin.deleteUser`.

#### Scenario: RLS enforced during erasure
- **WHEN** the delete-account function executes row deletions for the requesting user
- **THEN** those operations run through a client constructed with the anon key + user JWT, subject to RLS policies
- **AND** the service-role client is used only for the final `auth.admin.deleteUser` call

#### Scenario: Service-role client not used for user-scoped reads or deletes
- **WHEN** the delete-account function reads or deletes trips, preferences, or consent records
- **THEN** all such operations use the user-context (anon-key) client, not the service-role client

### Requirement: Erasure integrity — durable audit identity
The identity of the actor requesting erasure SHALL be persisted as immutable text in `audit_log.metadata`
before `auth.admin.deleteUser` is called, so that the audit record is not orphaned by the FK cascade.

#### Scenario: Audit log retains actor identity after user deletion
- **WHEN** a user's account is deleted
- **THEN** the `audit_log` row for the deletion event contains the actor's `user_id` (and optionally email) as a text field in `metadata`
- **AND** the row remains present and readable after the `auth.users` row is removed

#### Scenario: Erasure aborts if audit metadata write fails
- **WHEN** the pre-deletion `audit_log.metadata` write fails
- **THEN** the entire erasure is aborted and no user rows are deleted
- **AND** the error is surfaced to the caller rather than silently swallowed

### Requirement: Erasure integrity — consent-log cleanup and cascade verification
Consent log rows for the deleted user SHALL be explicitly deleted before `deleteUser` runs, and the
cascade behaviour of `trips` and `user_preferences` SHALL be verified to cover all user-owned data.

#### Scenario: Consent records removed as part of erasure
- **WHEN** a user's account is deleted
- **THEN** all `consent_log` rows with that `user_id` are deleted within the same erasure transaction
- **AND** no orphaned consent rows with `user_id = null` remain after deletion

#### Scenario: Trips and preferences are fully erased
- **WHEN** a user's account is deleted
- **THEN** `trips` and `user_preferences` rows for that user are removed (via cascade or explicit delete)
- **AND** a post-deletion count assertion confirms zero rows remain for the deleted user_id

### Requirement: Complete and accurate portability export
`dataExport` SHALL paginate through all trip rows and propagate fetch errors, so that an incomplete export
is never silently presented as complete (Decree 13 Art. 11).

#### Scenario: Export includes all trips beyond 1 000 rows
- **WHEN** a user has more than 1 000 trip records
- **THEN** the export fetches all pages and returns the complete set
- **AND** no silent truncation occurs at any page boundary

#### Scenario: Export error is surfaced to the caller
- **WHEN** a fetch error occurs during any pagination page
- **THEN** `dataExport` throws an `ExportError` and the caller presents a failure state to the user
- **AND** the UI does not display a partial export as if it were complete
