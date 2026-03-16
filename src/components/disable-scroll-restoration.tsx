"use client";

import { useEffect } from "react";

/**
 * Disables the browser's native scroll restoration on back/forward navigation.
 * Without this, the browser automatically restores scroll position when using
 * the back/forward buttons.
 */
export function DisableScrollRestoration() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      history.scrollRestoration = "manual";
    }
  }, []);

  return null;
}
