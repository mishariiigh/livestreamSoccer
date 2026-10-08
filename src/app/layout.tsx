import type { Metadata } from "next";
import Link from "next/link";
import { LocaleProvider } from "@/components/locale-provider";
import SiteHeader from "@/components/site-header";
import { BRAND } from "@/lib/brand";
import "./globals.css";
import "./platform.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://me7gan-live.com"),
  title: { default: `${BRAND.ar} | ${BRAND.en}`, template: `%s | ${BRAND.ar}` },
  description: "محقان لايف منصة لمتابعة مباريات كرة القدم وجدولها والبثوث المتاحة لكل مباراة.",
  applicationName: BRAND.ar,
  openGraph: {
    type: "website",
    siteName: `${BRAND.ar} · ${BRAND.en}`,
    locale: "ar_SA",
    title: `${BRAND.ar} | ${BRAND.en}`,
    description: "جدول مباريات كرة القدم والبثوث المتاحة لكل مباراة.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.ar} | ${BRAND.en}`,
    description: "جدول مباريات كرة القدم والبثوث المتاحة لكل مباراة.",
  },
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className="min-h-full">
      <body className="min-h-full antialiased">
        <LocaleProvider>
          <a className="sr-only" href="#main-content">تخط إلى المحتوى الرئيسي</a>
          <SiteHeader />
          {children}
          <footer className="site-footer">
            <div className="page-width footer-inner">
              <div className="footer-brand">
                <strong>{BRAND.ar}</strong>
                <span>منصة لمتابعة المباريات والبثوث المتاحة.</span>
              </div>
              <nav className="footer-nav" aria-label="روابط التذييل">
                <Link href="/">الرئيسية</Link>
                <Link href="/upcoming">المباريات</Link>
                <Link href="/live">مباشر الآن</Link>
                <Link href="/admin">الإدارة</Link>
              </nav>
              <span className="footer-meta" dir="ltr">© 2026 {BRAND.en}</span>
            </div>
          </footer>
        </LocaleProvider>
      </body>
    </html>
  );
}
