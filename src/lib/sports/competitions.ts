/**
 * The only competitions an administrator can assign to a match.
 *
 * This list is the contract shared by the admin form, the API validation layer,
 * and the database check constraint in `supabase/migrations/005_matches.sql`.
 * Arbitrary competition names are rejected — keep all three in sync.
 */
export const COMPETITIONS = [
  "Premier League",
  "La Liga",
  "Serie A",
  "Bundesliga",
  "Ligue 1",
  "UEFA Champions League",
] as const;

export type Competition = (typeof COMPETITIONS)[number];

export function isCompetition(value: unknown): value is Competition {
  return typeof value === "string" && (COMPETITIONS as readonly string[]).includes(value);
}