import HomePage from "@/components/home-page";
import { getPublicFixtureSchedule } from "@/lib/sports/matches";

export default async function Home() {
  const fixtureSchedule = await getPublicFixtureSchedule();
  return <HomePage fixtureSchedule={fixtureSchedule} />;
}