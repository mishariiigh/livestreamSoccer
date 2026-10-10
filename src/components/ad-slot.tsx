"use client";

import { useEffect, useRef } from "react";

/**
 * Reusable Google AdSense unit.
 *
 * Design rules this component deliberately follows:
 *
 * - It renders NOTHING when no slot ID is configured. A slot ID can only come
 *   from a real ad unit in the AdSense dashboard, so inventing one would
 *   produce either an empty grey box or a policy violation. Until the operator
 *   supplies a real slot, the page simply has no ad — never a broken frame.
 * - It never auto-refreshes and never overlays content. One push per mount.
 * - It is marked `advertisement` for assistive tech and carries a visible
 *   label, so it can never be mistaken for a stream link or a play button.
 * - `adsbygoogle.js` is loaded once in the root layout; this component only
 *   pushes the unit into the existing queue.
 */

/** Publisher ID is public (not a secret) and may be set through the environment. */
const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";

type AdSlotProps = {
  /** Ad unit ID from AdSense → Ads → By ad unit. Empty renders nothing. */
  slot: string | undefined;
  /** Placement hint. `auto` lets AdSense pick a fitting responsive format. */
  format?: "auto" | "horizontal" | "rectangle" | "vertical";
  /** Short label shown above the unit so it is clearly advertising. */
  label?: string;
  className?: string;
};

export default function AdSlot({
  slot,
  format = "auto",
  label = "إعلان",
  className = "",
}: AdSlotProps) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!CLIENT || !slot || pushed.current) return;
    pushed.current = true;
    try {
      const queue = (window.adsbygoogle = window.adsbygoogle || []);
      queue.push({});
    } catch {
      // Ad blockers and offline browsers reject the push. Nothing to recover:
      // the reserved space collapses rather than showing an empty box.
    }
  }, [slot]);

  // No publisher ID or no real ad unit yet — render nothing at all.
  if (!CLIENT || !slot) return null;

  return (
    <aside className={`ad-slot ${className}`.trim()} aria-label={label}>
      <span className="ad-slot-label">{label}</span>
      <ins
        className="adsbygoogle ad-slot-unit"
        style={{ display: "block" }}
        data-ad-client={CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </aside>
  );
}
