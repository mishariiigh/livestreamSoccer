"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Search, UserRound } from "lucide-react";
import { useState } from "react";
import { useLocale } from "@/components/locale-provider";

export default function SiteHeader() {
  const { locale, t, toggleLocale } = useLocale();
  const [query, setQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const nav = [
    ["/", t("home")],
    ["/live", t("live")],
    ["/upcoming", t("upcoming")],
  ];

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <header className="site-header">
      <div className="page-width header-inner">
        <Link href="/" className="brand" aria-label="مدى، الرئيسية">
          <span className="brand-mark"><span /></span>
          <span className="brand-word">مدى</span>
          <span className="brand-caption">LIVE</span>
        </Link>
        <nav className="main-nav" aria-label={locale === "ar" ? "التنقل الرئيسي" : "Main navigation"}>
          {nav.map(([href, label]) => (
            <Link className={pathname === href ? "nav-link active" : "nav-link"} href={href} key={href}>{label}</Link>
          ))}
        </nav>
        <div className="header-actions">
          <form className="header-search" onSubmit={submitSearch} role="search">
            <Search size={16} aria-hidden="true" />
            <input aria-label={t("search")} placeholder={t("search")} value={query} onChange={(event) => setQuery(event.target.value)} />
            <button type="submit" aria-label={t("search")}><ArrowLeft size={15} /></button>
          </form>
          <button className="language-button" type="button" onClick={toggleLocale} aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}>
            {locale === "ar" ? "EN" : "عربي"}
          </button>
          <Link className="account-button" href="/login" aria-label={t("account")} title={t("account")}><UserRound size={18} /></Link>
        </div>
      </div>
    </header>
  );
}