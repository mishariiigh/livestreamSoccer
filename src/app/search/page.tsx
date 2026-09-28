import type { Metadata } from "next";
import SearchResults from "@/components/search-results";
import { getPublicEvents } from "@/lib/events";

export const metadata: Metadata = { title: "ابحث عن فعالية", description: "ابحث في الفعاليات المباشرة والقادمة على مدى.", alternates: { canonical: "/search" } };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const params = await searchParams;
  const initialEvents = await getPublicEvents();
  return <SearchResults initialQuery={typeof params.q === "string" ? params.q : ""} initialCategory={typeof params.category === "string" ? params.category : ""} initialEvents={initialEvents} />;
}