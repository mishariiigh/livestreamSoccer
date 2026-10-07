import type { Metadata } from "next";
import LiveMatchListing from "@/components/live-match-listing";
import { getLiveMatches } from "@/lib/sports/matches";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "مباشر الآن", description: "المباريات المنشورة التي يتوفر لها بث مصرح به على مدى.", alternates: { canonical: "/live" } };

export default async function LivePage() {
  const { matches, error } = await getLiveMatches();
  return <LiveMatchListing matches={matches} error={error} />;
}