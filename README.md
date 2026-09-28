# Mada Live

Pre-launch, Arabic-first soccer streaming platform built with Next.js App Router, TypeScript, Tailwind CSS, Supabase (PostgreSQL/Auth/Storage), and HLS playback.

> **Distribution rule:** Publish only soccer video, artwork, and advertising that the operator is authorized to distribute. There are no preloaded fixtures or playback URLs. The public site remains empty until authorized soccer events and streams are entered. Video bytes are never relayed through Next.js or stored in PostgreSQL.

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
2. Set a strong `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. It is used only by the server-side viewer-session heartbeat handler. Never prefix it with `NEXT_PUBLIC_`, place it in client code, or commit it.
3. Apply `supabase/migrations/001_platform.sql` using the Supabase SQL Editor or Supabase CLI. It creates the schema, indexes, RLS policies, auth profile trigger, event-media storage bucket, and admin audit log.
4. Enable email/password under **Authentication → Providers**. Configure email confirmation and allowed redirect URLs for localhost and the production domain you choose.
5. Create the first operator account at `/register`. In the SQL Editor, grant administrator access to that account by replacing the email below:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'mishariiigh@hotmail.com');
```

After setting the profile role, the administrator can sign in at `/admin/login` using either the literal username `admin` or the account email. Set `ADMIN_LOGIN_EMAIL` to that administrator's email in `.env.local` and in the deployment environment. The alias is resolved only on the server and still checks the Supabase profile role; it does not bypass password authentication.

Only grant this role to trusted operators. The `is_admin()` RLS helper and server-side role check protect `/admin`, `/api/admin/*`, uploads, user-role changes, and revenue data. Administrator actions are written to `public.audit_logs`.
6. Confirm the `event-media` bucket exists. It accepts JPEG, PNG, WebP, or AVIF images up to 5 MB; its public read policy is for event artwork, and only admins can upload, update, or delete objects.
7. Enter only soccer fixtures and streams for which you have written distribution permission. Configure provider playback references from the operator console after signing in as admin; no example playback URL is supplied.

The migration creates profiles, events, categories, provider streams, ads, ad impressions/clicks, viewer sessions, favorites, site settings, reported revenue, and audit logs. Stream rows contain an HTTPS HLS playback URL/reference, never video itself. Public reads use Supabase plus RLS; admin writes use the authenticated cookie client plus RLS. No service-role credential is sent to the browser.

## Environment variables

Copy `.env.example` to `.env.local` and replace the placeholders:

- `DATABASE_URL`: Supabase PostgreSQL connection string for migration/admin tooling; content reads use Supabase APIs and RLS.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: public project/auth configuration; database RLS is mandatory.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only credential used for the narrow anonymous-session duration update.
- `ADMIN_LOGIN_EMAIL`: server-only email address mapped to the admin login alias `admin`.
- `STREAMING_PROVIDER_API_URL`, `STREAMING_PROVIDER_API_KEY`, `STREAMING_PROVIDER_SECRET`: reserved server-side integration credentials for a provider adapter. Never expose them to client code.
- `NEXTAUTH_SECRET`: reserved for future Auth.js integration; current sessions use Supabase Auth.
- `NEXT_PUBLIC_SITE_URL`: canonical production origin for metadata, Open Graph, sitemap, and robots.
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`: optional shared sliding-window rate limiting. Without them, a development-safe in-memory limiter is used; it is per instance and is not the only production limit across serverless replicas.

## Routes

- `/`, `/live`, `/upcoming`, `/search`
- `/events/[slug]`, `/watch/[slug]`
- `/login`, `/register`, `/account`
- `/admin/login`, `/admin`, `/admin/events`, `/admin/streams`, `/admin/ads`, `/admin/users`, `/admin/analytics`, `/admin/settings`

Arabic/RTL is the default; the header language control switches the interface and document direction to English/LTR. Event title and description fields support Arabic and English in PostgreSQL. Only soccer categories are offered: men's/general football, women's football, futsal, youth football, and football shows. Search, event metadata, Open Graph cards, JSON-LD SportsEvent data, `sitemap.xml`, and `robots.txt` are included.

## Streaming and advertising

The browser player uses native HLS where available and `hls.js` elsewhere. It supports standard video controls, captions when a VTT URL is configured, mobile inline playback, recoverable network/media errors, and reconnect attempts. The `StreamProvider` contract is in `src/lib/streaming/provider.ts`; add a provider adapter there for authenticated status/playback URL retrieval. Store the provider reference and CDN HLS URL in `streams`. The player does not load until an authorized, enabled, live stream record exists. Never proxy HLS manifests or segments through Next.js, and never use scraped, DRM-bypassed, geo-bypass, or unauthorized sources.

The ad gate checks for one active pre-roll/interstitial placement. It labels the placement “Advertisement”, offers one clear “Continue to live stream” action, and never requires an ad click or opens pop-ups. Ad network HTML is sandboxed in an iframe with a restrictive Content Security Policy; approve the code and network behavior before activation. Image/video destinations use normal separately labeled links with `rel="sponsored"`. Impressions are recorded when an active creative is presented; clicks are recorded only on an actual advertiser destination click. Network income is never fabricated: administrators enter or import reported amounts in `/admin/analytics`.

## Privacy and scale

Viewer analytics use a random pseudonymous visitor UUID, per-visit UUID, coarse device/browser labels, referrer host only, event ID, and session duration. The application does not store IP addresses or full referrer paths. Add a retention policy/job in production to delete viewer-session and ad-event records when they are no longer required by your policy or applicable law. Country is intentionally not inferred or collected by this starter.

Indexes cover public schedules, event categories/status, viewer session time, ad delivery, revenue dates, and audit history. Public catalog pages use server-side Supabase reads and may be CDN-cached once an invalidation policy is chosen. Video throughput is handled by the provider/CDN. Configure provider-side signed playback URLs or tokenized access where your distribution agreement requires them. Optional Upstash rate limits are shared across Vercel instances.

## Deploy to Vercel

1. Push the project to a Git provider and import it into Vercel.
2. Set production variables from `.env.example` in Vercel Project Settings → Environment Variables. Keep service-role, provider, and Redis secrets server-only.
3. Apply the Supabase migration and seed to the production project. Set the production site URL and Supabase Auth redirect allow-list.
4. Assign administrator role only to trusted operators, configure the licensed streaming provider/CDN, and verify authorized test material plays from its CDN.
5. Deploy with `npm run build` and `npm run start`. Vercel manages the production runtime. Keep media in Supabase Storage or the appropriate media CDN, not the application bundle.

## Validation

- Run `npm run lint` and `npm run build`.
- Visit `/`, `/live`, `/upcoming`, `/search`, `/login`, `/register`, `/admin/login`, then use an authorized event slug at `/events/[slug]` and `/watch/[slug]` after content has been entered.
- Without Supabase, verify empty catalog states and the redirect from admin pages to `/admin/login`.
- After Supabase setup, test signup/email confirmation, ordinary-user denial from `/admin`, administrator soccer-event/stream/ad creation, role changes, thumbnail upload, impression/click tracking, and revenue entry. Use only a provider stream and creatives you are authorized to distribute.
- Check mobile viewport layouts and HLS playback in Safari and a Chromium browser.

This repository does not include credentials, actual match schedules, rights agreements, a production streaming-provider contract, or a domain. Supabase auth, provider API validation, real revenue imports, content entry, operational monitoring, and launch approvals require the operator's own configuration. Deployment is intentionally not part of the current work.
# livestreamSoccer
