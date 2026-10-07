create table public.official_watch_links (
  id uuid primary key default gen_random_uuid(),
  fixture_id bigint not null check (fixture_id > 0),
  country_region text not null check (length(trim(country_region)) between 2 and 100),
  broadcaster_name text not null check (length(trim(broadcaster_name)) between 1 and 120),
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
  on public.official_watch_links for select to anon, authenticated using (active);
create policy "admins manage official watch links"
  on public.official_watch_links for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on public.official_watch_links to anon, authenticated;
grant insert, update, delete on public.official_watch_links to authenticated;