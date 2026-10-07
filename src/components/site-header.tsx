"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/locale-provider";

export default function SiteHeader() {
  const { locale, t, toggleLocale } = useLocale();
  const pathname = usePathname();
  const nav = [
    ["/", t("home")],
    ["/live", t("live")],
    ["/upcoming", t("upcoming")],
  ];

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
          <button className="language-button" type="button" onClick={toggleLocale} aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}>
            {locale === "ar" ? "EN" : "عربي"}
          </button>
        </div>
      </div>
    </header>
  );
}