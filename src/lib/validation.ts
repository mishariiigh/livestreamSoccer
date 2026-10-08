import { z } from "zod";

const secureUrl = z.string().url().refine((value) => value.startsWith("https://"), "HTTPS URL required");

/** Internal fixture ID generated for every manually created match (for example ML-20261007-0001). */
export const fixtureIdSchema = z
  .string()
  .trim()
  .regex(/^[A-Z0-9][A-Z0-9-]{2,39}$/, "Invalid fixture ID");

const optionalLogoUrl = secureUrl.nullable().optional().or(z.literal("").transform(() => null));

export const matchInput = z.object({
  match_date: z.string().date(),
  kickoff_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Kickoff time must be HH:MM"),
  competition: z.string().trim().min(1).max(80),
  home_team: z.string().trim().min(1).max(120),
  away_team: z.string().trim().min(1).max(120),
  home_team_logo: optionalLogoUrl,
  away_team_logo: optionalLogoUrl,
  published: z.boolean().default(true),
});

export const matchUpdateInput = z.object({
  match_date: z.string().date().optional(),
  kickoff_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  competition: z.string().trim().min(1).max(80).optional(),
  home_team: z.string().trim().min(1).max(120).optional(),
  away_team: z.string().trim().min(1).max(120).optional(),
  home_team_logo: optionalLogoUrl,
  away_team_logo: optionalLogoUrl,
  published: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const fixtureStreamInput = z.object({
  fixture_id: fixtureIdSchema,
  stream_type: z.enum(["hls", "embed", "external"]),
  stream_url: secureUrl,
  provider_name: z.string().trim().min(1).max(120),
  active: z.boolean(),
  priority: z.number().int().min(0).max(10000),
});

export const fixtureStreamUpdateInput = z.object({
  id: z.string().uuid(),
  fixture_id: fixtureIdSchema.optional(),
  stream_type: z.enum(["hls", "embed", "external"]).optional(),
  stream_url: secureUrl.optional(),
  provider_name: z.string().trim().min(1).max(120).optional(),
  active: z.boolean().optional(),
  priority: z.number().int().min(0).max(10000).optional(),
}).superRefine((value, context) => {
  const hasUpdate = Object.keys(value).some((key) => key !== "id");
  if (!hasUpdate) context.addIssue({ code: "custom", message: "At least one update is required." });
  if ((value.stream_type === undefined) !== (value.stream_url === undefined)) {
    context.addIssue({ code: "custom", path: ["stream_url"], message: "Update the stream type and URL together." });
  }
});

export const fixtureStreamDeleteInput = z.object({ id: z.string().uuid() });

export const officialWatchLinkInput = z.object({
  fixture_id: fixtureIdSchema,
  country_region: z.string().trim().min(2).max(100),
  broadcaster_name: z.string().trim().min(1).max(120),
  official_watch_url: secureUrl,
  active: z.boolean(),
});

export const officialWatchLinkUpdateInput = z.object({
  id: z.string().uuid(),
  country_region: z.string().trim().min(2).max(100).optional(),
  broadcaster_name: z.string().trim().min(1).max(120).optional(),
  official_watch_url: secureUrl.optional(),
  active: z.boolean().optional(),
}).refine((value) => Object.keys(value).some((key) => key !== "id"));

export const officialWatchLinkDeleteInput = z.object({ id: z.string().uuid() });