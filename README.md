# Mada Live

Pre-launch, Arabic-first soccer streaming platform built with Next.js App Router, TypeScript, Tailwind CSS, Supabase (PostgreSQL/Auth/Storage), and HLS playback.

> **Distribution rule:** Publish only soccer video, artwork, and advertising that the operator is authorized to distribute. There are no preloaded matches or playback URLs. The public site remains empty until an administrator enters authorized matches and streams. Video bytes are never relayed through Next.js or stored in PostgreSQL.

## Requirements

- Node.js 20.9 or later and npm
- A Supabase project for persistent authentication, content, analytics, and media uploads
- Optional Upstash Redis for shared rate limits across serverless instances
- A licensed streaming provider delivering HLS over its CDN

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Without Supabase configuration, public event pages show empty states and admin routes redirect to `/admin/login`. No fictional matches or sample player feed are bundled. The project has not been deployed; launch is intentionally deferred until your Supabase project, licensed provider, authorized content, domain, and launch approvals are ready.

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Supabase setup

1. Create a Supabase project. In **Project Settings → API**, copy the project URL and anon/publishable key into `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
2. Apply the migrations in `supabase/migrations/` in order (`001_platform.sql` … `006_fixture_streams_internal_id.sql`) using the Supabase SQL Editor or Supabase CLI. `005_matches.sql` creates the manually managed match schedule and `006_fixture_streams_internal_id.sql` keys the HLS/embed sources and official broadcaster links to the internal fixture ID. Public reads are limited to published matches and active sources; mutations are admin-only under RLS.
3. Enable email/password under **Authentication → Providers**. Configure email confirmation and allowed redirect URLs for localhost and the production domain you choose.
4. Create the first operator account at `/register`. In the SQL Editor, grant administrator access to that account by replacing the email below:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'mishariiigh@hotmail.com');
```

After setting the profile role, the administrator can sign in at `/admin/login` using either the literal username `admin` or the account email. Set `ADMIN_LOGIN_EMAIL` to that administrator's email in `.env.local` and in the deployment environment. The alias is resolved only on the server and still checks the Supabase profile role; it does not bypass password authentication.

Only grant this role to trusted operators. The `is_admin()` RLS helper and server-side role check protect `/admin` and `/api/admin/*`. Administrator actions are written to `public.audit_logs`.
5. Enter only matches and streams for which you have written distribution permission. Sign in at `/admin`, create a match, and attach its authorized HLS or embed source. No example playback URL is supplied.

The match schedule lives in `public.matches` and its authorized sources in `public.fixture_streams`. Stream rows contain HTTPS playback references, never video itself. Public reads use Supabase plus RLS; admin writes use the authenticated cookie client plus RLS. No service-role credential is sent to the browser.

## Environment variables

Copy `.env.example` to `.env.local` and replace the placeholders:

- `DATABASE_URL`: Supabase PostgreSQL connection string for migration/admin tooling; content reads use Supabase APIs and RLS.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: public project/auth configuration; database RLS is mandatory.
- `ADMIN_LOGIN_EMAIL`: server-only email address mapped to the admin login alias `admin`.
- **No football data provider key is required.** The schedule is entered by administrators in the admin match page and stored in Supabase. If you previously set `API_FOOTBALL_KEY`, it is no longer read by the application and can be deleted from `.env.local` and your deployment environment.
- `STREAMING_PROVIDER_API_URL`, `STREAMING_PROVIDER_API_KEY`, `STREAMING_PROVIDER_SECRET`: reserved server-side integration credentials for a provider adapter. Never expose them to client code.
- `NEXTAUTH_SECRET`: reserved for future Auth.js integration; current sessions use Supabase Auth.
- `NEXT_PUBLIC_SITE_URL`: canonical production origin for metadata, Open Graph, sitemap, and robots.
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`: optional shared sliding-window rate limiting. Without them, a development-safe in-memory limiter is used; it is per instance and is not the only production limit across serverless replicas.

## Routes

- `/`, `/live`, `/upcoming`
- `/match/[fixtureId]` (internal fixture ID, for example `/match/ML-20261007-0001`)
- `/login`, `/register`, `/account`
- `/admin` — the single match + stream management page (`/admin/login` redirects here)

Arabic/RTL is the default; the header language control switches the interface and document direction to English/LTR. `sitemap.xml` and `robots.txt` are included.

## Schedule, streaming and advertising

The homepage Next Up section and `/upcoming` read the manually managed schedule from Supabase (`public.matches`) for the real "today" and "tomorrow" calendar dates in `Asia/Riyadh`. Nothing is hard-coded in the frontend, there is no external fixture provider, no API polling, and no live-score feed. Administrators create every match from the single **`/admin`** page — date, kickoff time, competition, teams, logos, publish state and its stream — and each match receives a stable internal fixture ID from the database, for example `ML-20261007-0001`.

The same `/admin` form attaches one authorized source per save: either HLS (`.m3u8`) or an HTTPS embed/iframe URL, with a provider name, priority and an active flag. Sources are stored in `public.fixture_streams`; the highest-priority **active** source is selected first, and lower-priority active sources remain available for manual or playback-error fallback. `/live` lists only published matches that have an active stream.

Official broadcaster links are also supported per match and country/region (managed directly in Supabase; they appear on `/match/[fixtureId]` when active). On the match page, active official links open the broadcaster website in a new tab and the HLS/embed player renders when a stream is configured; otherwise the page shows "البث غير متاح حالياً". The fixture player loads through the server-side `getAuthorizedStream(fixtureId)` provider interface in `src/lib/streaming/fixture-service.ts`. The current database provider uses Supabase SSR and RLS; replace or extend it later with your official provider adapter to request fresh, authorized playback URLs. HLS playback uses native support or `hls.js`; embeds are sandboxed. Store provider references, not video itself. Never proxy HLS segments through Next.js, hard-code temporary tokens, scrape protected URLs, or bypass DRM, authentication, or token expiration.

## Privacy and scale

The application does not store IP addresses or full referrer paths.

Indexes cover the public schedule and stream lookups, plus audit history. Public schedule pages use server-side Supabase reads. Video throughput is handled by the provider/CDN. Configure provider-side signed playback URLs or tokenized access where your distribution agreement requires them. Optional Upstash rate limits are shared across Vercel instances.

## Deploy to Vercel

1. Push the project to a Git provider and import it into Vercel.
2. Set production variables from `.env.example` in Vercel Project Settings → Environment Variables. Keep provider and Redis secrets server-only.
3. Apply the Supabase migrations to the production project. Set the production site URL and Supabase Auth redirect allow-list.
4. Assign administrator role only to trusted operators, configure the licensed streaming provider/CDN, and verify authorized test material plays from its CDN.
5. Deploy with `npm run build` and `npm run start`. Vercel manages the production runtime. Keep media in Supabase Storage or the appropriate media CDN, not the application bundle.

## Validation

- Run `npm run lint` and `npm run build`.
- Visit `/`, `/live`, `/upcoming`, `/login`, `/register`, `/admin`.
- Without Supabase, verify empty schedule states and that `/admin` shows the sign-in form.
- After Supabase setup, test signup/email confirmation, ordinary-user denial from `/admin`, and administrator match creation with its HLS or embed source. Use only a provider stream you are authorized to distribute.
- Check mobile viewport layouts and HLS playback in Safari and a Chromium browser.

This repository does not include credentials, actual match schedules, rights agreements, a production streaming-provider contract, or a domain. Supabase auth, content entry, operational monitoring, and launch approvals require the operator's own configuration. Deployment is intentionally not part of the current work.
# livestreamSoccer
