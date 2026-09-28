import type { Metadata } from "next";
import EventListing from "@/components/event-listing";
import { getPublicEvents } from "@/lib/events";

export const metadata: Metadata = { title: "مباشر الآن", description: "شاهد الفعاليات المباشرة المرخصة على مدى.", alternates: { canonical: "/live" } };

export default async function LivePage() {
  const initialEvents = await getPublicEvents();
  return <EventListing status="live" initialEvents={initialEvents} />;
}