import type { Metadata } from "next";
import { Radio } from "lucide-react";
import MatchesListing from "@/components/matches-listing";
import { getLiveMatches, getPublicFixtureSchedule } from "@/lib/sports/matches";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مباشر الآن",
  description: "المباريات المتاحة للمشاهدة الآن: البث داخل الموقع والروابط الرسمية للناقلين.",
  alternates: { canonical: "/live" },
};

/**
 * Live page.
 *
 * `getLiveMatches` returns every published match that has an active playable
 * stream OR an active official external link, so external-only matches stay
 * visible here and are labelled as official broadcasts on their card.
 */
export default async function LivePage() {
  const [{ matches, error }, fixtureSchedule] = await Promise.all([
    getLiveMatches(),
    getPublicFixtureSchedule(),
  ]);

  return (
    <main id="main-content" className="page-width listing-page">
      <div className="page-head">
        <span className="eyebrow">{BRAND.en} / ON AIR</span>
        <h1>مباشر الآن</h1>
        <p>المباريات التي يتوفر لها بث داخل الموقع أو رابط رسمي من الناقل.</p>
      </div>

      <div className="stat-strip">
        <Radio size={17} aria-hidden="true" />
        <span>{error ? "تعذر تحميل المباريات حالياً." : "بث متاح الآن"}</span>
        <b>{error ? "—" : matches.length.toString().padStart(2, "0")}</b>
      </div>

      {error ? (
        <div className="fixture-list-error" role="alert">تعذر تحميل المباريات. حاول إعادة تحميل الصفحة.</div>
      ) : (
        <MatchesListing fixtureSchedule={fixtureSchedule} matches={matches} mode="live" />
      )}
    </main>
  );
}