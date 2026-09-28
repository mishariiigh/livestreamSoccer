"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Locale = "ar" | "en";
type DictionaryKey = keyof typeof copy.ar;

const copy = {
  ar: {
    home: "الرئيسية", live: "مباشر الآن", upcoming: "قريباً", categories: "التصنيفات", search: "ابحث عن فعالية", account: "حسابي",
    liveNow: "مباشر الآن", startingSoon: "على وشك البدء", upcomingEvents: "فعاليات قادمة", popular: "الأكثر مشاهدة", browseAll: "عرض الكل",
    discover: "اكتشف ما يستحق المشاهدة", today: "اليوم", allEvents: "كل الفعاليات", watchLive: "شاهد البث", details: "التفاصيل", ad: "إعلان",
    watch: "شاهد الآن", schedule: "جدول اليوم", minutes: "مشاهدة مباشرة", noResults: "لا توجد فعاليات مطابقة للبحث.",
    searchTitle: "ابحث عن فعالية", events: "فعالية", sponsored: "فعالية برعاية", share: "مشاركة", description: "عن الفعالية", related: "قد يعجبك أيضاً",
  },
  en: {
    home: "Home", live: "Live now", upcoming: "Upcoming", categories: "Categories", search: "Search events", account: "Account",
    liveNow: "Live now", startingSoon: "Starting soon", upcomingEvents: "Upcoming events", popular: "Most watched", browseAll: "Browse all",
    discover: "Find your next watch", today: "Today", allEvents: "All events", watchLive: "Watch live", details: "Details", ad: "Advertisement",
    watch: "Watch now", schedule: "Today's schedule", minutes: "watching live", noResults: "No events match your search.",
    searchTitle: "Search events", events: "events", sponsored: "Sponsored event", share: "Share", description: "About this event", related: "You may also like",
  },
} as const;

type LocaleContextValue = {
  locale: Locale;
  direction: "rtl" | "ltr";
  toggleLocale: () => void;
  t: (key: DictionaryKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("ar");

  useEffect(() => {
    const saved = window.localStorage.getItem("mada-locale");
    if (saved === "en" || saved === "ar") window.setTimeout(() => setLocale(saved), 0);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    window.localStorage.setItem("mada-locale", locale);
  }, [locale]);

  const value: LocaleContextValue = {
    locale,
    direction: locale === "ar" ? "rtl" : "ltr",
    toggleLocale: () => setLocale((current) => current === "ar" ? "en" : "ar"),
    t: (key) => copy[locale][key],
  };

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within LocaleProvider");
  return context;
}