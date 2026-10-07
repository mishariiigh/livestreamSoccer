import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Competition } from "@/lib/sports/competitions";
import {
  formatKickoffTime,
  getNextScheduleDate,
  getScheduleDate,
  type PublicFixtureSchedule,
  type PublicMatch,
} from "@/lib/sports/match-types";

export type { PublicFixtureSchedule, PublicMatch } from "@/lib/sports/match-types";
export { MATCH_TIMEZONE } from "@/lib/sports/match-types";

export type MatchRow = {
  id: string;
  fixture_id: string;
  match_date: string;
  kickoff_time: string;
  competition: Competition;
  home_team: string;
  away_team: string;
  home_team_logo: string | null;
  away_team_logo: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
};

const MATCH_COLUMNS =
  "id, fixture_id, match_date, kickoff_time, competition, home_team, away_team, home_team_logo, away_team_logo, published, created_at, updated_at";

/** Today's calendar date in the project timezone. Never hard-coded. */
export function getTodayScheduleDate() {
  return getScheduleDate();
}

/** Tomorrow's calendar date in the project timezone. Never hard-coded. */
export function getTomorrowScheduleDate() {
  return getNextScheduleDate(getTodayScheduleDate());
}

function mapMatch(row: MatchRow, options: { hasActiveStream?: boolean } = {}): PublicMatch {
  return {
    fixtureId: row.fixture_id,
    matchDate: row.match_date,
    kickoffTime: row.kickoff_time,
    kickoffLabel: formatKickoffTime(row.kickoff_time),
    competition: row.competition,
    home: { name: row.home_team, logo: row.home_team_logo },
    away: { name: row.away_team, logo: row.away_team_logo },
    hasActiveStream: options.hasActiveStream ?? false,
  };
}

async function withActiveStreamFlag(rows: MatchRow[]): Promise<PublicMatch[]> {
  if (rows.length === 0) return [];
  const client = await createSupabaseServerClient();
  if (!client) return rows.map((row) => mapMatch(row));

  const fixtureIds = rows.map((row) => row.fixture_id);
  const { data, error } = await client
    .from("fixture_streams")
    .select("fixture_id")
    .in("fixture_id", fixtureIds)
    .eq("active", true);

  if (error || !data) return rows.map((row) => mapMatch(row));
  const streamed = new Set((data as { fixture_id: string }[]).map((row) => row.fixture_id));
  return rows.map((row) => mapMatch(row, { hasActiveStream: streamed.has(row.fixture_id) }));
}

/**
 * Public schedule for the homepage and /upcoming.
 *
 * Reads only published matches from Supabase for the real "today" and
 * "tomorrow" calendar dates. Matches on any other date are intentionally not
 * returned here — they remain available in Admin → Schedule.
 */
export async function getPublicFixtureSchedule(): Promise<PublicFixtureSchedule> {
  const todayDate = getTodayScheduleDate();
  const tomorrowDate = getTomorrowScheduleDate();
  const empty = { today: [], tomorrow: [], todayDate, tomorrowDate, error: false };

  const client = await createSupabaseServerClient();
  if (!client) return empty;

  const { data, error } = await client
    .from("matches")
    .select(MATCH_COLUMNS)
    .eq("published", true)
    .in("match_date", [todayDate, tomorrowDate])
    .order("match_date", { ascending: true })
    .order("kickoff_time", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return { ...empty, error: true };

  const rows = (data ?? []) as MatchRow[];
  const withStreams = await withActiveStreamFlag(rows);
  return {
    today: withStreams.filter((match) => match.matchDate === todayDate),
    tomorrow: withStreams.filter((match) => match.matchDate === tomorrowDate),
    todayDate,
    tomorrowDate,
    error: false,
  };
}

/** Published matches that have at least one active authorized stream. */
export async function getLiveMatches(): Promise<{ matches: PublicMatch[]; error: boolean }> {
  const client = await createSupabaseServerClient();
  if (!client) return { matches: [], error: false };

  const { data: streamRows, error: streamError } = await client
    .from("fixture_streams")
    .select("fixture_id")
    .eq("active", true)
    .range(0, 999);
  if (streamError) return { matches: [], error: true };

  const fixtureIds = [...new Set((streamRows ?? []).map((row) => (row as { fixture_id: string }).fixture_id))];
  if (fixtureIds.length === 0) return { matches: [], error: false };

  const { data, error } = await client
    .from("matches")
    .select(MATCH_COLUMNS)
    .eq("published", true)
    .in("fixture_id", fixtureIds)
    .order("match_date", { ascending: true })
    .order("kickoff_time", { ascending: true });
  if (error) return { matches: [], error: true };

  return {
    matches: (data as MatchRow[]).map((row) => mapMatch(row, { hasActiveStream: true })),
    error: false,
  };
}

/** A single published match, resolved by its internal fixture ID. */
export async function getPublicMatchByFixtureId(fixtureId: string): Promise<PublicMatch | null> {
  const client = await createSupabaseServerClient();
  if (!client) return null;
  const { data, error } = await client
    .from("matches")
    .select(MATCH_COLUMNS)
    .eq("fixture_id", fixtureId)
    .eq("published", true)
    .maybeSingle();
  if (error || !data) return null;
  return mapMatch(data as MatchRow);
}