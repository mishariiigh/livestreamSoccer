"use client";

import { CalendarDays, Radio, Tv } from "lucide-react";
import { useMemo, useState } from "react";
import MatchCard from "@/components/match-card";
import { useLocale } from "@/components/locale-provider";
import { EmptyState } from "@/components/ui/primitives";
import type { getPublicFixtureSchedule } from "@/lib/sports/matches";
import type { PublicMatch } from "@/lib/sports/match-types";

type Schedule = Awaited<ReturnType<typeof getPublicFixtureSchedule>>;
type Filter = "all" | "stream" | "external";

/**
 * Shared schedule listing used by /upcoming and /live.
 *
 * `live` mode additionally shows external-only matches, so an official
 * broadcaster link is never hidden just because there is no on-site stream.
 */
export default function MatchesListing({
  fixtureSchedule,
  matches,
  mode = "schedule",
}: {
  fixtureSchedule?: Schedule;
  matches?: PublicMatch[];
  mode?: "schedule" | "live";
}) {
  const { locale } = useLocale();
  const [filter, setFilter] = useState<Filter>("all");

  const pool = useMemo(() => {
    if (mode === "live") return matches ?? [];
    if (!fixtureSchedule) return [];
    return [...fixtureSchedule.today, ...fixtureSchedule.tomorrow];
  }, [fixtureSchedule, matches, mode]);

  const visible = useMemo(() => {
    if (filter === "stream") return pool.filter((match) => match.hasActiveStream);
    if (filter === "external") return pool.filter((match) => !match.hasActiveStream);
    return pool;
  }, [pool, filter]);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: locale === "ar" ? "الكل" : "All" },
    { id: "stream", label: locale === "ar" ? "بث داخل الموقع" : "On-site stream" },
    { id: "external", label: locale === "ar" ? "بث رسمي" : "Official broadcast" },
  ];

  const groups = useMemo(() => {
    const byDate = new Map<string, PublicMatch[]>();
    for (const match of visible) {
      const list = byDate.get(match.matchDate) ?? [];
      list.push(match);
      byDate.set(match.matchDate, list);
    }
    return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [visible]);

  const todayDate = fixtureSchedule?.todayDate;
  const tomorrowDate = fixtureSchedule?.tomorrowDate;

  if (pool.length === 0) {
    return (
      <EmptyState
        icon={mode === "live" ? <Radio size={20} /> : <CalendarDays size={20} />}
        title={
          mode === "live"
            ? locale === "ar" ? "لا يوجد بث متاح الآن" : "No broadcasts available right now"
            : locale === "ar" ? "لا توجد مباريات منشورة" : "No published matches"
        }        description={
          locale === "ar"
            ? "ستظهر المباريات هنا بمجرد نشرها من لوحة الإدارة."
            : "Matches appear here once published from the admin panel."
        }
      />
    );
  }

  return (
    <>
      <div className="filter-bar" role="group" aria-label={locale === "ar" ? "تصفية المباريات" : "Filter matches"}>
        {filters.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={filter === id ? "filter-chip active" : "filter-chip"}
            onClick={() => setFilter(id)}
            aria-pressed={filter === id}
          >
            {label}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={<Tv size={20} />}
          title={locale === "ar" ? "لا توجد مباريات مطابقة" : "No matching matches"}
          description={locale === "ar" ? "جرّب اختيار تصفية أخرى." : "Try another filter."}
        />
      ) : (
        groups.map(([date, dateMatches]) => (
          <section className="date-group" key={date}>
            <div className="date-group-heading">
              <h3>
                {date === todayDate
                  ? locale === "ar" ? "مباريات اليوم" : "Today"
                  : date === tomorrowDate
                    ? locale === "ar" ? "مباريات الغد" : "Tomorrow"
                    : locale === "ar" ? "مباريات قادمة" : "Upcoming"}
              </h3>
              <span>
                {new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
                  dateStyle: "full",
                  timeZone: "UTC",
                }).format(new Date(`${date}T00:00:00Z`))}
              </span>
              <span className="date-group-count">{dateMatches.length}</span>
            </div>
            <div className="match-grid">
              {dateMatches.map((match) => (
                <MatchCard key={match.fixtureId} match={match} live={mode === "live"} />
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}
