import type { MetadataRoute } from "next";
import { getPublicEvents } from "@/lib/events";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mada.live";
  const events = await getPublicEvents();
  const lastModified = new Date();
  return [
    { url: base, lastModified, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/live`, lastModified, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/upcoming`, lastModified, changeFrequency: "daily", priority: 0.8 },
    ...events.flatMap((event) => [
      { url: `${base}/events/${event.slug}`, lastModified, changeFrequency: "daily" as const, priority: 0.75 },
      { url: `${base}/watch/${event.slug}`, lastModified, changeFrequency: "hourly" as const, priority: 0.7 },
    ]),
  ];
}