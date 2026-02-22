"use client";

import { Share } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useShare } from "@/hooks/use-share";

export default function ShareButton({
  org,
  repo,
}: {
  org: string;
  repo: string;
}) {
  const share = useShare();

  return (
    <Button
      size="icon"
      className="hidden md:flex bg-nom-blue hover:bg-nom-blue/90"
      onClick={() => share(`${window.location.origin}/${org}/${repo}`, repo)}
    >
      <Share />
    </Button>
  );
}
