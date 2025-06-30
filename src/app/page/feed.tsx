"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";

import ActivityCard from "@/components/shared/activity-card";
import { Button } from "@/components/ui/button";

import { fetchFeed } from "./feed/actions";

const LIMIT = 10;

export default function Feed() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: [fetchFeed.key],
    queryFn: ({ pageParam }) => fetchFeed({ limit: LIMIT, offset: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.hasMore) {
        return allPages.reduce((acc, page) => acc + page.items.length, 0);
      }
      return undefined;
    },
    initialPageParam: 0,
  });

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
      {items.map((item) => {
        const org = item.repositories.org;
        const repo = item.repositories.repo;
        return <ActivityCard key={item.id} item={item} repo={repo} org={org} />;
      })}
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
