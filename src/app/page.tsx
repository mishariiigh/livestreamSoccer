import HomePage from "@/components/home-page";
import { getLiveMatches, getPublicFixtureSchedule } from "@/lib/sports/matches";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [fixtureSchedule, live] = await Promise.all([
    getPublicFixtureSchedule(),
    getLiveMatches(),
  ]);
  return <HomePage fixtureSchedule={fixtureSchedule} liveMatches={live.matches} />;
}