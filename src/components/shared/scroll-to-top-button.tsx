"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SCROLL_THRESHOLD = 200;
const THROTTLE_MS = 100;

export default function ScrollToTopButton({
  onScrollToTop,
}: {
  onScrollToTop: () => void;
}) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const lastUpdate = useRef(0);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const updateVisibility = () => {
      setShowScrollTop(window.scrollY > SCROLL_THRESHOLD);
    };

    const handleScroll = () => {
      if (rafId.current) return;
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        const now = Date.now();
        if (now - lastUpdate.current < THROTTLE_MS) return;
        lastUpdate.current = now;
        updateVisibility();
      });
    };

    // Check on mount in case we're already scrolled
    updateVisibility();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("scrollend", updateVisibility);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scrollend", updateVisibility);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <Button
      aria-label="Scroll to top"
      onClick={() => {
        onScrollToTop();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className={cn(
        "fixed left-1/2 -translate-x-1/2 top-10 z-70 border",
        "shadow-lg p-2 hover:bg-background/90",
        "active:scale-95 border-nom-yellow bg-background text-white",
        "transition-all duration-300 flex items-center justify-center hover:scale-105",
        showScrollTop
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none -translate-y-8 -translate-x-1/2"
      )}
      size="icon"
    >
      <ArrowUp className="w-5 h-5" />
    </Button>
  );
}
