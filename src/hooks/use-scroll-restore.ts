"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { getAndClearScrollPosition } from "@/lib/scroll-restore";

/**
 * Restores scroll position when returning to a feed page from a status.
 * Call this in feed components (home feed, repo feed) to restore the
 * scroll position that was saved when the user clicked an activity.
 */
export function useScrollRestore(): void {
  const pathname = usePathname();

  useEffect(() => {
    const y = getAndClearScrollPosition(pathname);
    if (y === null) return;

    // Defer to next frame so layout/paint has happened
    requestAnimationFrame(() => {
      window.scrollTo(0, y);
    });
  }, [pathname]);
}
