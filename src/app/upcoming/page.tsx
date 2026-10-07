import type { Metadata } from "next";
import PublicFixtureSchedule from "@/components/public-fixture-schedule";
import { getPublicFixtureSchedule } from "@/lib/sports/matches";

export const metadata: Metadata = { title: "قريباً", description: "مباريات اليوم والغد المنشورة على مدى.", alternates: { canonical: "/upcoming" } };

export default async function UpcomingPage() {
  const fixtureSchedule = await getPublicFixtureSchedule();
  return (
    <main className="page-width listing-page">
      <div className="listing-top reveal">
        <div>
          <span className="eyebrow">MADA / COMING UP</span>
          <h1>قريباً</h1>
          <p>مباريات اليوم والغد المنشورة من إدارة الموقع.</p>
        </div>
      </div>
      <PublicFixtureSchedule {...fixtureSchedule} />
    </main>
  );
}