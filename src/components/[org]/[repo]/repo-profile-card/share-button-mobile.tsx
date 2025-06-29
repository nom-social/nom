"use client";

import { Share } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useShare } from "@/hooks/use-share";

export default function ShareButtonMobile({
  org,
  repo,
}: {
  org: string;
  repo: string;
}) {
  const share = useShare();

  return (
    <Button
      className="flex md:hidden bg-[var(--nom-blue)] hover:bg-[var(--nom-blue)]/90"
      onClick={() => share(`${window.location.origin}/${org}/${repo}`, repo)}
    >
      <Share />
      Share
    </Button>
  );
}
