import { z } from "zod";

const localizedText = z.object({ ar: z.string().trim().min(1).max(240), en: z.string().trim().min(1).max(240) });
const secureUrl = z.string().url().refine((value) => value.startsWith("https://"), "HTTPS URL required");

export const eventInput = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  title: localizedText,
  description: z.object({ ar: z.string().max(5000), en: z.string().max(5000) }),
  category_id: z.string().max(60).nullable().optional(),
  starts_at: z.string().datetime(),
  thumbnail_url: secureUrl,
  status: z.enum(["upcoming", "live", "ended"]).default("upcoming"),
  published: z.boolean().default(false),
});

export const streamInput = z.object({
  event_id: z.string().uuid(), provider: z.string().trim().min(1).max(100),
  provider_stream_id: z.string().max(200).optional(), playback_url: secureUrl,
  captions_url: secureUrl.nullable().optional(), stream_status: z.enum(["live", "offline", "scheduled"]), enabled: z.boolean(),
});

export const adInput = z.object({
  name: z.string().trim().min(1).max(180),
  type: z.enum(["top-banner", "sidebar-banner", "in-content", "pre-roll", "mid-roll", "post-roll", "sponsored-event", "interstitial"]),
  image_url: secureUrl.nullable().optional(), video_url: secureUrl.nullable().optional(), destination_url: z.string().url().refine((value) => value.startsWith("https://") || value.startsWith("http://")).nullable().optional(),
  html_code: z.string().max(20000).nullable().optional(), active: z.boolean().default(false), start_date: z.string().datetime().nullable().optional(), end_date: z.string().datetime().nullable().optional(), event_id: z.string().uuid().nullable().optional(),
});

export const adTrackingInput = z.object({ adId: z.string().uuid(), eventId: z.string().uuid().optional(), sessionId: z.string().uuid().optional() });
export const viewerInput = z.object({ visitId: z.string().uuid(), visitorId: z.string().uuid(), eventId: z.string().uuid().optional(), referrerHost: z.string().max(255).optional(), deviceType: z.enum(["mobile", "tablet", "desktop", "other"]).optional(), browser: z.string().max(100).optional() });
export const viewerHeartbeatInput = z.object({ visitId: z.string().uuid(), durationSeconds: z.number().int().min(0).max(86400) });
export const revenueInput = z.object({ revenue_date: z.string().date(), amount: z.number().finite().min(0), currency: z.string().length(3).default("USD"), source: z.string().trim().min(1).max(200), event_id: z.string().uuid().nullable().optional(), ad_id: z.string().uuid().nullable().optional() });