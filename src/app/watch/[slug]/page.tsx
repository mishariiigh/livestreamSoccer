import type { Metadata } from "next";
import { notFound } from "next/navigation";
import WatchPage from "@/components/watch-page";
import { getPublicEventBySlug, getPublicEvents } from "@/lib/events";

export async function generateMetadata({ params }: PageProps<"/watch/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublicEventBySlug(slug);
  if (!event) return { title: "البث غير متاح" };
  return {
    title: `${event.title.ar} — بث مباشر`,
    description: event.description.ar,
    alternates: { canonical: `/watch/${event.slug}` },
    openGraph: { title: `${event.title.ar} — بث مباشر`, description: event.description.ar, images: event.image ? [event.image] : [], type: "video.other" },
    twitter: { card: "summary_large_image", title: event.title.ar, images: event.image ? [event.image] : [] },
  };
}

export default async function WatchRoute({ params }: PageProps<"/watch/[slug]">) {
  const { slug } = await params;
  const event = await getPublicEventBySlug(slug);
  if (!event) notFound();
  const relatedEvents = await getPublicEvents();
  return <WatchPage event={event} relatedEvents={relatedEvents} />;
}