import type { Metadata } from "next";
import EventListing from "@/components/event-listing";
import { getPublicEvents } from "@/lib/events";

export const metadata: Metadata = { title: "فعاليات قادمة", description: "اكتشف مواعيد الفعاليات القادمة على مدى.", alternates: { canonical: "/upcoming" } };

export default async function UpcomingPage() {
  const initialEvents = await getPublicEvents();
  return <EventListing status="upcoming" initialEvents={initialEvents} />;
}