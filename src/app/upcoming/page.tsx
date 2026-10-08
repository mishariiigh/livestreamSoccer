import type { Metadata } from "next";
import MatchesListing from "@/components/matches-listing";
import { getPublicFixtureSchedule } from "@/lib/sports/matches";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "المباريات", description: "جدول مباريات اليوم والغد والبثوث المتاحة لكل مباراة.", alternates: { canonical: "/upcoming" } };

export default async function UpcomingPage() {
  const fixtureSchedule = await getPublicFixtureSchedule();
  return (
    <main id="main-content" className="page-width listing-page">
      <div className="page-head">
        <span className="eyebrow">{BRAND.en} / MATCHES</span>
        <h1>المباريات</h1>
        <p>مباريات اليوم والغد المنشورة، مع البث المتاح لكل مباراة.</p>
      </div>
      <MatchesListing fixtureSchedule={fixtureSchedule} />
    </main>
  );
}