-- Manual, database-driven football schedule.
--
-- Every match is created by an administrator in Admin → Schedule. There is no
-- external fixture provider: this table is the single source of truth for the
-- public TODAY / TOMORROW schedule, the match page, and stream assignment.
--
-- Date/time handling: `match_date` is a calendar date and `kickoff_time` is a
-- wall-clock time, both interpreted in the project timezone (Asia/Riyadh, see
-- `public.match_timezone()`). Storing the calendar day as its own column means
-- a match can never drift into the wrong day because of a UTC conversion.

create or replace function public.match_timezone()
returns text language sql immutable
as $$ select 'Asia/Riyadh'::text; $$;

-- "Today" / "tomorrow" as calendar dates in the project timezone.
create or replace function public.match_today()
returns date language sql stable
as $$ select (now() at time zone public.match_timezone())::date; $$;

create or replace function public.match_tomorrow()
returns date language sql stable
as $$ select public.match_today() + 1; $$;

create table public.matches (
  id uuid primary key default gen_random_uuid(),

  -- Stable internal identifier used by the public match page (/match/[fixtureId]),
  -- the fixture_streams table, and the official watch links table. Never derived
  -- from an external provider.
  fixture_id text not null unique
    check (fixture_id ~ '^[A-Z0-9][A-Z0-9-]{2,39}$'),

  match_date date not null,
  kickoff_time time not null,
  competition text not null
    check (competition in (
      'Premier League',
      'La Liga',
      'Serie A',
      'Bundesliga',
      'Ligue 1',
      'UEFA Champions League'
    )),
  home_team text not null check (length(btrim(home_team)) between 1 and 120),
  away_team text not null check (length(btrim(away_team)) between 1 and 120),
  home_team_logo text check (home_team_logo is null or home_team_logo ~ '^https://'),
  away_team_logo text check (away_team_logo is null or away_team_logo ~ '^https://'),
  published boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Public schedule reads filter by calendar date and kickoff order.
create index matches_schedule_idx on public.matches (match_date, kickoff_time);
create index matches_published_date_idx on public.matches (published, match_date, kickoff_time);
create index matches_competition_idx on public.matches (competition, match_date);

create or replace function public.touch_matches_updated_at()
returns trigger language plpgsql
as $$ begin new.updated_at = now(); return new; end; $$;

create trigger matches_touch_updated_at
before update on public.matches
for each row execute procedure public.touch_matches_updated_at();

-- Generates a unique internal fixture ID, for example ML-20261007-0001 for the
-- first match created for 7 October 2026. Retries on the (unlikely) collision.
create or replace function public.generate_match_fixture_id(target_date date)
returns text language plpgsql security definer set search_path = public
as $$
declare
  candidate text;
  sequence_number integer := 0;
begin
  loop
    sequence_number := sequence_number + 1;
    candidate := 'ML-' || to_char(target_date, 'YYYYMMDD') || '-' || lpad(sequence_number::text, 4, '0');
    exit when not exists (select 1 from public.matches where fixture_id = candidate);
  end loop;
  return candidate;
end;
$$;

alter table public.matches enable row level security;

-- Visitors may read published matches only. They can never insert, update, or delete.
create policy "published matches public read"
  on public.matches for select to anon, authenticated
  using (published or public.is_admin());

create policy "admins manage matches"
  on public.matches for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on public.matches to anon, authenticated;
grant insert, update, delete on public.matches to authenticated;