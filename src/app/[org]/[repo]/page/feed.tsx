"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";

import { Button } from "@/components/ui/button";
import ActivityCard from "@/components/shared/activity-card";

import { fetchFeedPage, FetchFeedPageResult } from "./feed/actions";

const LIMIT = 4;

export default function Feed({
  repoId,
  repo,
  org,
}: {
  repoId: string;
  repo: string;
  org: string;
}) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery<FetchFeedPageResult, Error>({
    queryKey: ["feed", repoId],
    queryFn: ({ pageParam }) => {
      const offset = typeof pageParam === "number" ? pageParam : 0;
      return fetchFeedPage({
        repoId,
        limit: LIMIT,
        offset,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.hasMore) {
        return allPages.reduce((acc, page) => acc + page.items.length, 0);
      }
      return undefined;
    },
    initialPageParam: 0,
  });

  // TODO: Add proper loading state
  if (isLoading) return <div>Loading...</div>;
  if (isError)
    return (
      <div>
        Error: {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="flex flex-col gap-4">
      {items.length === 0 && (
        <div className="text-muted-foreground">No activity yet.</div>
      )}
      {items.map((item) => (
        <ActivityCard key={item.id} item={item} repo={repo} org={org} />
      ))}
      {hasNextPage && (
        <Button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          variant="ghost"
          className="mb-4"
        >
          {isFetchingNextPage ? <Loader className="animate-spin" /> : null} Load
          more
        </Button>
      )}
    </div>
  );
}
