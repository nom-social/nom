"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import React, { useRef, useCallback } from "react";

import ActivityCard from "@/components/shared/activity-card";
import ClaimRepoButton from "@/components/shared/claim-repo-button";

import { fetchPublicFeed } from "./actions";

const LIMIT = 10;

export default function FeedPublic() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: [fetchPublicFeed.key],
    queryFn: ({ pageParam }) =>
      fetchPublicFeed({ limit: LIMIT, offset: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.hasMore) {
        return allPages.reduce((acc, page) => acc + page.items.length, 0);
      }
      return undefined;
    },
    initialPageParam: 0,
  });

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  // Intersection Observer logic
  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelIndex = items.length > 0 ? Math.floor(items.length / 2) : -1;
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new window.IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isFetchingNextPage, fetchNextPage, hasNextPage]
  );

  return (
    <div className="flex flex-col gap-4">
      <ClaimRepoButton />
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
      {items.map((item, idx) => {
        const org = item.repositories.org;
        const repo = item.repositories.repo;
        const isSentinel = idx === sentinelIndex && hasNextPage;
        return (
          <div key={item.id} ref={isSentinel ? sentinelRef : undefined}>
            <ActivityCard item={item} repo={repo} org={org} />
          </div>
        );
      })}
      {isFetchingNextPage && (
        <div className="flex flex-row items-center gap-2 text-muted-foreground">
          <Loader className="animate-spin w-4 h-4" /> Loading more...
        </div>
      )}
      {items.length > 0 && !hasNextPage && !isLoading && (
        <div className="text-muted-foreground text-center pb-4">
          - End of feed -
        </div>
      )}
    </div>
  );
}
