"use client";

import Link from "next/link";
import { CalendarDays, Radio } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import type { PublicFixtureSchedule as FixtureSchedule, PublicMatch } from "@/lib/sports/match-types";

function FixtureCard({ fixture, locale }: { fixture: PublicMatch; locale: "ar" | "en" }) {
  return (
    <Link className="public-fixture-card" href={`/match/${fixture.fixtureId}`} aria-label={`${fixture.home.name} vs ${fixture.away.name}`}>
      <div className="public-fixture-card-top">
        <span className="public-fixture-competition">{fixture.competition}</span>
        <span className={fixture.hasActiveStream ? "public-fixture-status live" : "public-fixture-status"}>
          {fixture.hasActiveStream && <i />}
          {fixture.hasActiveStream ? (locale === "ar" ? "البث متاح" : "Stream ready") : (locale === "ar" ? "قادمة" : "Scheduled")}
        </span>
      </div>
      <div className="public-fixture-teams">
        <div className="public-fixture-team">
          <span aria-hidden="true" style={fixture.home.logo ? { backgroundImage: `url("${fixture.home.logo}")` } : undefined} />
          <strong>{fixture.home.name}</strong>
        </div>
        <span className="public-fixture-versus">VS</span>
        <div className="public-fixture-team">
          <span aria-hidden="true" style={fixture.away.logo ? { backgroundImage: `url("${fixture.away.logo}")` } : undefined} />
          <strong>{fixture.away.name}</strong>
        </div>
      </div>
      <div className="public-fixture-kickoff">
        <CalendarDays size={13} />
        {fixture.kickoffLabel} · {locale === "ar" ? "توقيت الرياض" : "Riyadh time"}
      </div>
    </Link>
  );
}

function FixtureDateGroup({ fixtures, date, title, locale, error }: {
  fixtures: PublicMatch[];
  date: string;
  title: { eyebrow: string; heading: string };
  locale: "ar" | "en";
  error: boolean;
}) {
  const dateLabel = date
    ? new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", { dateStyle: "full", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`))
    : "";
  return (
    <section className="public-fixture-group">
      <div className="public-fixture-group-heading">
        <div><span className="eyebrow">{title.eyebrow}</span><h2>{title.heading}</h2></div>
        {dateLabel && <span>{dateLabel}</span>}
        {!error && <b>{fixtures.length.toLocaleString(locale === "ar" ? "ar-SA" : "en-GB")}</b>}
      </div>
      {error ? (
        <div className="public-fixture-empty" role="alert">{locale === "ar" ? "تعذر تحميل جدول المباريات حالياً." : "The schedule is temporarily unavailable."}</div>
      ) : fixtures.length ? (
        <div className="public-fixture-grid">{fixtures.map((fixture) => <FixtureCard key={fixture.fixtureId} fixture={fixture} locale={locale} />)}</div>
      ) : (
        <div className="public-fixture-empty"><Radio size={17} />{locale === "ar" ? "لا توجد مباريات في هذا التاريخ." : "No matches for this date."}</div>
      )}
    </section>
  );
}

export default function PublicFixtureSchedule({ today, tomorrow, todayDate, tomorrowDate, error }: FixtureSchedule) {
  const { locale } = useLocale();

  return (
    <div className="public-fixture-schedule">
      <FixtureDateGroup fixtures={today} date={todayDate} error={error} title={{ eyebrow: "TODAY / اليوم", heading: locale === "ar" ? "مباريات اليوم" : "Today's matches" }} locale={locale} />
      <FixtureDateGroup fixtures={tomorrow} date={tomorrowDate} error={error} title={{ eyebrow: "TOMORROW / غداً", heading: locale === "ar" ? "مباريات الغد" : "Tomorrow's matches" }} locale={locale} />
    </div>
  );
}