"use client";

import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";

import { fetchRepoCount } from "./claim-repo-button/actions";

export default function ClaimRepoButton() {
  const { data, isLoading } = useQuery({
    queryKey: [fetchRepoCount.key],
    queryFn: () => fetchRepoCount(),
    refetchOnWindowFocus: false,
  });

  if (isLoading) return null;
  if (typeof data !== "number") return null;
  if (data > 0) return null;

  return (
    <a
      href="https://tally.so/r/mVaDaN"
      target="_blank"
      rel="noopener noreferrer"
      className="w-full"
    >
      <Button size="sm" className="w-full bg-[var(--nom-yellow)] text-black">
        Claim your repo 🎉
      </Button>
    </a>
  );
}
