create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'viewer' check (role in ('viewer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'); $$;

create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.create_profile_for_new_user();

create table public.categories (
  id text primary key,
  name jsonb not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.categories (id, name, sort_order) values
  ('football', '{"ar":"كرة القدم","en":"Football"}', 1),
  ('women-football', '{"ar":"كرة القدم النسائية","en":"Women''s football"}', 2),
  ('futsal', '{"ar":"كرة الصالات","en":"Futsal"}', 3),
  ('youth-football', '{"ar":"كرة القدم للشباب","en":"Youth football"}', 4),
  ('football-shows', '{"ar":"برامج كرة القدم","en":"Football shows"}', 5)
on conflict (id) do nothing;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title jsonb not null,
  description jsonb not null default '{}'::jsonb,
  category_id text references public.categories(id) on delete set null,
  starts_at timestamptz not null,
  thumbnail_url text not null check (thumbnail_url ~ '^https://'),
  participants jsonb,
  status text not null default 'upcoming' check (status in ('upcoming', 'live', 'ended')),
  published boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_public_schedule_idx on public.events (published, starts_at desc);
create index events_category_schedule_idx on public.events (category_id, starts_at desc) where published;
create index events_status_schedule_idx on public.events (status, starts_at) where published;

create table public.streams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  provider text not null,
  provider_stream_id text,
  playback_url text not null check (playback_url ~ '^https://'),
  captions_url text check (captions_url is null or captions_url ~ '^https://'),
  stream_status text not null default 'offline' check (stream_status in ('live', 'offline', 'scheduled')),
  enabled boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id)
);

create index streams_event_enabled_idx on public.streams (event_id, enabled, stream_status);

create table public.ads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('top-banner', 'sidebar-banner', 'in-content', 'pre-roll', 'mid-roll', 'post-roll', 'sponsored-event', 'interstitial')),
  image_url text,
  video_url text,
  destination_url text,
  html_code text,
  active boolean not null default false,
  start_date timestamptz,
  end_date timestamptz,
  event_id uuid references public.events(id) on delete set null,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_date is null or end_date is null or end_date > start_date),
  check (destination_url is null or destination_url ~ '^https?://')
);

create index ads_active_schedule_idx on public.ads (type, start_date, end_date) where active;

create table public.viewer_sessions (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null,
  event_id uuid references public.events(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  country_code text,
  device_type text,
  browser text,
  referrer_host text,
  created_at timestamptz not null default now()
);

create index viewer_sessions_event_time_idx on public.viewer_sessions (event_id, started_at desc);
create index viewer_sessions_recent_idx on public.viewer_sessions (last_seen_at desc);
create index viewer_sessions_user_time_idx on public.viewer_sessions (user_id, started_at desc) where user_id is not null;
create index viewer_sessions_visitor_idx on public.viewer_sessions (visitor_id, started_at desc);

create table public.ad_impressions (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.ads(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  viewer_session_id uuid references public.viewer_sessions(id) on delete set null,
  created_at timestamptz not null default now()
);
create index ad_impressions_ad_time_idx on public.ad_impressions (ad_id, created_at desc);

create table public.ad_clicks (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.ads(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  impression_id uuid references public.ad_impressions(id) on delete set null,
  viewer_session_id uuid references public.viewer_sessions(id) on delete set null,
  created_at timestamptz not null default now()
);
create index ad_clicks_ad_time_idx on public.ad_clicks (ad_id, created_at desc);

create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.revenue_entries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete set null,
  ad_id uuid references public.ads(id) on delete set null,
  revenue_date date not null,
  amount numeric(14, 4) not null check (amount >= 0),
  currency char(3) not null default 'USD',
  source text not null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index revenue_entries_date_idx on public.revenue_entries (revenue_date desc);
create index revenue_entries_event_idx on public.revenue_entries (event_id, revenue_date desc) where event_id is not null;

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_time_idx on public.audit_logs (created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-media', 'event-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "public read event media" on storage.objects for select to anon, authenticated using (bucket_id = 'event-media');
create policy "admin upload event media" on storage.objects for insert to authenticated with check (bucket_id = 'event-media' and public.is_admin());
create policy "admin update event media" on storage.objects for update to authenticated using (bucket_id = 'event-media' and public.is_admin()) with check (bucket_id = 'event-media' and public.is_admin());
create policy "admin delete event media" on storage.objects for delete to authenticated using (bucket_id = 'event-media' and public.is_admin());

create or replace function public.increment_ad_impressions()
returns trigger language plpgsql security definer set search_path = public
as $$ begin update public.ads set impressions = impressions + 1 where id = new.ad_id; return new; end; $$;
create trigger ad_impression_counter after insert on public.ad_impressions
for each row execute procedure public.increment_ad_impressions();

create or replace function public.increment_ad_clicks()
returns trigger language plpgsql security definer set search_path = public
as $$ begin update public.ads set clicks = clicks + 1 where id = new.ad_id; return new; end; $$;
create trigger ad_click_counter after insert on public.ad_clicks
for each row execute procedure public.increment_ad_clicks();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.events enable row level security;
alter table public.streams enable row level security;
alter table public.ads enable row level security;
alter table public.viewer_sessions enable row level security;
alter table public.ad_impressions enable row level security;
alter table public.ad_clicks enable row level security;
alter table public.favorites enable row level security;
alter table public.site_settings enable row level security;
alter table public.revenue_entries enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles read self or admin" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "admins update profile roles" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "categories public read" on public.categories for select to anon, authenticated using (true);
create policy "categories admin manage" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "published events public read" on public.events for select to anon, authenticated using (published or public.is_admin());
create policy "events admin manage" on public.events for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "enabled streams public read" on public.streams for select to anon, authenticated using ((enabled and exists (select 1 from public.events e where e.id = event_id and e.published)) or public.is_admin());
create policy "streams admin manage" on public.streams for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "active ads public read" on public.ads for select to anon, authenticated using (active and (start_date is null or start_date <= now()) and (end_date is null or end_date >= now()) or public.is_admin());
create policy "ads admin manage" on public.ads for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "viewer session insert public" on public.viewer_sessions for insert to anon, authenticated with check (event_id is null or exists (select 1 from public.events e where e.id = event_id and e.published));
create policy "viewer sessions admin read" on public.viewer_sessions for select to authenticated using (public.is_admin());
create policy "public ad impressions" on public.ad_impressions for insert to anon, authenticated with check (exists (select 1 from public.ads a where a.id = ad_id and a.active));
create policy "ad impressions admin read" on public.ad_impressions for select to authenticated using (public.is_admin());
create policy "public ad clicks" on public.ad_clicks for insert to anon, authenticated with check (exists (select 1 from public.ads a where a.id = ad_id and a.active));
create policy "ad clicks admin read" on public.ad_clicks for select to authenticated using (public.is_admin());
create policy "favorites own rows" on public.favorites for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "site settings admin only" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "revenue admin only" on public.revenue_entries for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "audit logs admin only" on public.audit_logs for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.profiles, public.site_settings, public.revenue_entries, public.audit_logs from anon;
grant select on public.categories, public.events, public.streams, public.ads to anon, authenticated;
grant select, insert, update, delete on public.events, public.streams, public.ads, public.categories, public.favorites, public.site_settings, public.revenue_entries, public.audit_logs to authenticated;
grant select on public.profiles, public.viewer_sessions, public.ad_impressions, public.ad_clicks to authenticated;
grant insert on public.viewer_sessions to anon, authenticated;
grant insert on public.ad_impressions, public.ad_clicks to anon, authenticated;