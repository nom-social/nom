"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Syncs a value to a URL search param. When value is truthy, sets the param;
 * when empty, removes it. Preserves other params.
 */
export function useSyncParamToUrl(key: string, value: string): void {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Only sync params on the route where this hook was mounted.
  // Prevents the hook from firing when a modal pushes a different route's
  // URL via window.history.pushState(), which would trigger Next.js to
  // navigate to that route.
  const mountedPathnameRef = useRef(pathname);

  useEffect(() => {
    if (pathname !== mountedPathnameRef.current) return;

    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    const currentUrl = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    if (newUrl !== currentUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [key, value, pathname, router, searchParams]);
}
