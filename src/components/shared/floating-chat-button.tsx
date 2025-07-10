"use client";

import React from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

export default function FloatingChatButton() {
  const { setOpen } = useSidebar();

  return (
    <Button
      aria-label="Open chat assistant"
      className={cn(
        "fixed bottom-6 right-6 z-50 border",
        "shadow-lg p-3 hover:bg-background/90",
        "border-nom-blue bg-background text-white",
        "flex items-center justify-center",
        "h-14 w-14"
      )}
      size="icon"
      onClick={() => setOpen(true)}
    >
      <Sparkles className="w-8 h-8" />
    </Button>
  );
}
