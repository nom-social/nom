"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import React, { useRef, useCallback } from "react";

import ActivityCard from "@/components/shared/activity-card";

import { fetchFeed } from "./actions";

const LIMIT = 10;

export default function FeedPrivate() {
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

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  // Intersection Observer logic
  const observerMiddle = useRef<IntersectionObserver | null>(null);
  const observerLast = useRef<IntersectionObserver | null>(null);
  const sentinelMiddleIndex =
    items.length > 0 ? Math.floor(items.length / 2) : -1;
  const sentinelLastIndex = items.length > 0 ? items.length - 1 : -1;

  const sentinelMiddleRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerMiddle.current) observerMiddle.current.disconnect();
      observerMiddle.current = new window.IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observerMiddle.current.observe(node);
    },
    [isFetchingNextPage, fetchNextPage, hasNextPage]
  );

  const sentinelLastRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerLast.current) observerLast.current.disconnect();
      observerLast.current = new window.IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observerLast.current.observe(node);
    },
    [isFetchingNextPage, fetchNextPage, hasNextPage]
  );

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
      {items.map((item, idx) => {
        const org = item.repositories.org;
        const repo = item.repositories.repo;
        let ref;
        if (hasNextPage) {
          if (idx === sentinelMiddleIndex) ref = sentinelMiddleRef;
          if (idx === sentinelLastIndex) ref = sentinelLastRef;
        }
        return (
          <div key={item.id} ref={ref}>
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
