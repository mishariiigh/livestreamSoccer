# Mada Live Workspace Guidance

- Use Next.js App Router, TypeScript, Tailwind CSS, and the existing Supabase SSR helpers.
- Keep the website Arabic-first with RTL by default; preserve English LTR support and responsive mobile layouts.
- Distribute only content the operator is authorized to publish. Never scrape streams, bypass DRM/geoblocking, or rebroadcast unauthorized feeds.
- Video must be delivered directly by a licensed streaming provider/CDN; never proxy video through Next.js or store video in PostgreSQL.
- Protect admin pages and APIs with server-side Supabase user/role checks and RLS. Never expose service-role/provider secrets to client code.
- Validate external input with Zod, rate-limit public APIs, and record admin mutations in the audit log.
- Ads must be clearly labeled and use legitimate placements. No fake controls, forced redirects, pop-ups, deceptive clicks, or forced ad clicks.
- Do not represent estimated ad revenue as actual network earnings; only use imported/provider-reported amounts.
- Keep analytics pseudonymous and limited to the fields documented in README.md.
- Before finishing code changes, run `npm run lint` and `npm run build`; for UI work, validate public/admin routes at desktop and mobile sizes.
