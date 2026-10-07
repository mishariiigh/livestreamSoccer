create table public.fixture_streams (
  id uuid primary key default gen_random_uuid(),
  fixture_id bigint not null check (fixture_id > 0),
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

create policy "active fixture streams public read"
  on public.fixture_streams for select to anon, authenticated using (active);
create policy "admins manage fixture streams"
  on public.fixture_streams for all to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

grant select on public.fixture_streams to anon, authenticated;
grant insert, update, delete on public.fixture_streams to authenticated;