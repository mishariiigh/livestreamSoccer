import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventDetail from "@/components/event-detail";
import { getPublicEventBySlug, getPublicEvents } from "@/lib/events";

export async function generateMetadata({ params }: PageProps<"/events/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublicEventBySlug(slug);
  if (!event) return { title: "الفعالية غير موجودة" };
  return {
    title: event.title.ar,
    description: event.description.ar,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: { title: event.title.ar, description: event.description.ar, images: event.image ? [event.image] : [], type: "article" },
    twitter: { card: "summary_large_image", title: event.title.ar, description: event.description.ar, images: event.image ? [event.image] : [] },
  };
}

export default async function EventPage({ params }: PageProps<"/events/[slug]">) {
  const { slug } = await params;
  const event = await getPublicEventBySlug(slug);
  if (!event) notFound();
  const relatedEvents = await getPublicEvents();
  return <EventDetail event={event} relatedEvents={relatedEvents} />;
}