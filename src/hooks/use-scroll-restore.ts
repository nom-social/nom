"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { getAndClearScrollPosition } from "@/lib/scroll-restore";

/**
 * Restores scroll position when returning to a feed page from a status.
 * Uses pathname + search params as the restore key so tab selection
 * (and other query state) is preserved along with scroll position.
 */
export function useScrollRestore(): void {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pathWithSearch = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  useEffect(() => {
    const y = getAndClearScrollPosition(pathWithSearch);
    if (y === null) return;

    // Defer to next frame so layout/paint has happened
    requestAnimationFrame(() => {
      window.scrollTo(0, y);
    });
  }, [pathWithSearch]);
}
