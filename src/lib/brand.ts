/**
 * Brand identity, in one place.
 *
 * Changing the site name should only require editing this file.
 * These are display strings only — no database table, Supabase object,
 * environment variable or API route is named after the brand.
 */
export const BRAND = {
  /** Primary visible brand, Arabic. */
  ar: "محقان لايف",
  /** English / latin brand. */
  en: "me7gan-live",
  /** Short mark used in the compact logo tile. */
  mark: "مح",
  /** Tagline shown under the brand in the footer. */
  tagline: "منصة لمتابعة المباريات والبثوث المتاحة.",
  /**
   * Brand logo, served from /public.
   *
   * `logo1.png` is the source artwork, but its visible lockup is a ~1.8:1
   * wordmark centred inside a padded square. `me7gan-logo.png` is that same
   * artwork cropped to its content, so it stays legible at header size instead
   * of being scaled down into a mostly-empty square.
   */
  logo: "/me7gan-logo.png",
  /** Intrinsic pixel size of the cropped logo, used to preserve its ratio. */
  logoWidth: 400,
  logoHeight: 223,
} as const;
