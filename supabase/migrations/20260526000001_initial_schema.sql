-- Phase 0b.1 — Initial schema for MoodTrip platform
-- Tables: profiles, preferences, trips, remixes, consent_log, audit_log

set check_function_bodies = off;

create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  home_province text,
  paid_plan boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  preferred_moods text[] not null default '{}',
  preferred_short_moods text[] not null default '{}',
  default_budget integer,
  default_start_location text,
  dietary_notes text,
  mobility_notes text,
  language text not null default 'vi',
  region_dialect text,
  updated_at timestamptz not null default now()
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  destination text not null,
  trip_mode text not null check (trip_mode in ('long', 'short')),
  form_input jsonb not null,
  skeleton jsonb not null,
  enrichment jsonb,
  is_public boolean not null default false,
  share_slug text unique,
  parent_remix_id uuid references public.trips (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trips_owner_id_idx on public.trips (owner_id, created_at desc);
create index trips_public_idx on public.trips (is_public, created_at desc) where is_public = true;
create index trips_share_slug_idx on public.trips (share_slug) where share_slug is not null;

create table public.consent_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  anonymous_token_hash text,
  consent_version text not null,
  consent_scope text[] not null,
  accepted_at timestamptz not null default now(),
  user_agent text,
  ip_country text
);

create index consent_log_user_idx on public.consent_log (user_id, accepted_at desc);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_actor_idx on public.audit_log (actor_id, created_at desc);
create index audit_log_resource_idx on public.audit_log (resource_type, resource_id);

alter table public.profiles enable row level security;
alter table public.preferences enable row level security;
alter table public.trips enable row level security;
alter table public.consent_log enable row level security;
alter table public.audit_log enable row level security;

create policy "profiles_self_select"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_self_insert"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_self_update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "preferences_self_all"
  on public.preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "trips_owner_all"
  on public.trips for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "trips_public_select"
  on public.trips for select
  using (is_public = true);

create policy "consent_log_self_select"
  on public.consent_log for select
  using (auth.uid() = user_id);

create policy "consent_log_insert_authenticated"
  on public.consent_log for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "audit_log_self_select"
  on public.audit_log for select
  using (auth.uid() = actor_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger preferences_set_updated_at
  before update on public.preferences
  for each row execute function public.set_updated_at();

create trigger trips_set_updated_at
  before update on public.trips
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', null)
  )
  on conflict (id) do nothing;

  insert into public.preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
