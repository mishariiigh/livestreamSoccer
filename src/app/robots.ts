import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mada.live";
  return {
    rules: [{ userAgent: "*", allow: ["/", "/live", "/upcoming", "/events/", "/watch/", "/search"], disallow: ["/admin", "/account", "/login", "/register", "/api/"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}