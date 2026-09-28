import type { Metadata } from "next";
import Link from "next/link";
import { LocaleProvider } from "@/components/locale-provider";
import SiteHeader from "@/components/site-header";
import "./globals.css";
import "./platform.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://mada.live"),
  title: { default: "مدى | بث مباشر", template: "%s | مدى" },
  description: "تابع الفعاليات الرياضية والترفيهية المباشرة والمواعيد القادمة على مدى.",
  applicationName: "مدى",
  openGraph: {
    type: "website",
    siteName: "مدى",
    locale: "ar_SA",
    title: "مدى | بث مباشر",
    description: "فعاليات مباشرة، في مكان واحد.",
  },
  twitter: { card: "summary_large_image", title: "مدى | بث مباشر", description: "فعاليات مباشرة، في مكان واحد." },
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className="min-h-full">
      <body className="min-h-full antialiased">
        <LocaleProvider>
          <SiteHeader />
          {children}
          <footer className="site-footer">
            <div className="page-width">
              <span>مدى</span>
              <span>© 2026 · محتوى مرخّص فقط</span>
              <Link href="/admin">إدارة المنصة</Link>
            </div>
          </footer>
        </LocaleProvider>
      </body>
    </html>
  );
}
