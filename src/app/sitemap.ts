import type { MetadataRoute } from "next";
import { getLiveMatches } from "@/lib/sports/matches";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mada.live";
  const { matches } = await getLiveMatches();
  const lastModified = new Date();
  return [
    { url: base, lastModified, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/live`, lastModified, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/upcoming`, lastModified, changeFrequency: "daily", priority: 0.8 },
    ...matches.map((match) => ({
      url: `${base}/match/${match.fixtureId}`,
      lastModified,
      changeFrequency: "hourly" as const,
      priority: 0.7,
    })),
  ];
}