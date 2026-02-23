"use client";

import { usePathname, useSearchParams } from "next/navigation";

/**
 * Returns the current full URL (pathname + search params) for use as a
 * "back" link. Preserves any query state when navigating away and back.
 */
export function useBackUrl(): string {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return searchParams.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;
}
