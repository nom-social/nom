"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";

import { Button } from "@/components/ui/button";
import ActivityCard from "@/components/shared/activity-card";

import { fetchFeedPage, FetchFeedPageResult } from "./feed/actions";

const LIMIT = 10;

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
    queryKey: [fetchFeedPage.key, repoId],
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

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="flex flex-col gap-4">
      {items.length === 0 && !isLoading && (
        <div className="text-muted-foreground">No activity yet.</div>
      )}
      {isError && (
        <div className="text-muted-foreground">
          Error: {error instanceof Error ? error.message : "Unknown error"}
        </div>
      )}
      {isLoading && (
        <div className="flex flex-row items-center gap-2 text-muted-foreground">
          <Loader className="animate-spin w-4 h-4" /> Loading...
        </div>
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
