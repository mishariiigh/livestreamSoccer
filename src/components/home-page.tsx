"use client";

import Link from "next/link";
import { CalendarDays, Radio } from "lucide-react";
import PublicFixtureSchedule from "@/components/public-fixture-schedule";
import { useLocale } from "@/components/locale-provider";
import type { getPublicFixtureSchedule } from "@/lib/sports/matches";

export default function HomePage({ fixtureSchedule }: { fixtureSchedule: Awaited<ReturnType<typeof getPublicFixtureSchedule>> }) {
  const { locale, t } = useLocale();

  return (
    <main>
      <section className="home-intro page-width reveal">
        <div className="intro-copy">
          <span className="intro-kicker"><span className="kicker-dot" /> {locale === "ar" ? "كرة قدم مباشرة من مصادر مصرح بها" : "Live soccer from authorized sources"}</span>
          <h1>{locale === "ar" ? <>كرة القدم،<br /><em>مباشرة.</em></> : <>Soccer,<br /><em>live.</em></>}</h1>
          <p>{locale === "ar" ? "جدول المباريات المنشور من إدارة الموقع، مع البث المصرح به لكل مباراة." : "The match schedule published by the site team, with an authorized stream per match."}</p>
        </div>
      </section>

      <section className="content-section page-width">
        <div className="section-heading">
          <div><span className="eyebrow">01 / NEXT UP</span><h2>{t("startingSoon")}</h2></div>
          <Link href="/upcoming">{t("browseAll")} <CalendarDays size={15} /></Link>
        </div>
        <PublicFixtureSchedule {...fixtureSchedule} />
      </section>

      <section className="content-section page-width final-section">
        <div className="section-heading">
          <div><span className="eyebrow">02 / ON AIR</span><h2>{t("liveNow")}</h2></div>
          <Link href="/live">{t("browseAll")} <Radio size={15} /></Link>
        </div>
        <div className="catalog-empty">
          <Radio size={18} />
          <span>{locale === "ar" ? "المباريات التي يتوفر لها بث مصرح به تظهر في صفحة مباشر الآن." : "Matches with an authorized stream appear on the Live now page."}</span>
          <Link href="/live">{locale === "ar" ? "مباشر الآن" : "Live now"}<Radio size={14} /></Link>
        </div>
      </section>
    </main>
  );
}