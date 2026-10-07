-- Re-key the authorized stream system to the internal fixture ID.
--
-- Before this migration `fixture_streams` and `official_watch_links` were keyed
-- by a numeric identifier from a retired external football data provider. They
-- are now keyed by the text `matches.fixture_id` generated for every manually
-- created match.
--
-- Legacy rows are dropped: they referenced external provider IDs that no longer
-- exist in this architecture. Streams are attached to a match directly from the
-- single admin match-management page.
--
-- The retired external-provider fixture cache is dropped here as well, since
-- migration 004 no longer exists in this repository.

drop table if exists public.fixture_cache;
drop table if exists public.fixture_streams;
drop table if exists public.official_watch_links;

create table public.fixture_streams (
  id uuid primary key default gen_random_uuid(),
  fixture_id text not null
    check (fixture_id ~ '^[A-Z0-9][A-Z0-9-]{2,39}$'),
  stream_type text not null check (stream_type in ('hls', 'embed')),
  stream_url text not null check (stream_url ~ '^https://'),
  provider_name text not null,
  active boolean not null default false,
  priority integer not null default 0 check (priority between 0 and 10000),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index fixture_streams_active_priority_idx
  on public.fixture_streams (fixture_id, active, priority desc, created_at asc);

alter table public.fixture_streams enable row level security;

-- Active sources of a published match are readable by visitors; nothing else is.
create policy "active fixture streams public read"
  on public.fixture_streams for select to anon, authenticated
  using (
    active
    and exists (
      select 1 from public.matches m
      where m.fixture_id = fixture_streams.fixture_id
        and m.published
    )
  );
create policy "admins manage fixture streams"
  on public.fixture_streams for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on public.fixture_streams to anon, authenticated;
grant insert, update, delete on public.fixture_streams to authenticated;

create table public.official_watch_links (
  id uuid primary key default gen_random_uuid(),
  fixture_id text not null
    check (fixture_id ~ '^[A-Z0-9][A-Z0-9-]{2,39}$'),
  country_region text not null check (length(btrim(country_region)) between 2 and 100),
  broadcaster_name text not null check (length(btrim(broadcaster_name)) between 1 and 120),
  official_watch_url text not null check (official_watch_url ~ '^https://'),
  active boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index official_watch_links_fixture_active_region_idx
  on public.official_watch_links (fixture_id, active, country_region, broadcaster_name);

alter table public.official_watch_links enable row level security;

create policy "active official watch links public read"
  on public.official_watch_links for select to anon, authenticated
  using (
    active
    and exists (
      select 1 from public.matches m
      where m.fixture_id = official_watch_links.fixture_id
        and m.published
    )
  );
create policy "admins manage official watch links"
  on public.official_watch_links for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on public.official_watch_links to anon, authenticated;
grant insert, update, delete on public.official_watch_links to authenticated;