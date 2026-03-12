"use client";

import { usePaginatedQuery } from "convex/react";
import { Loader } from "lucide-react";
import React, { useRef, useCallback } from "react";

import ActivityCard from "@/components/shared/activity-card";
import ScrollToTopButton from "@/components/shared/scroll-to-top-button";
import { api } from "@/../convex/_generated/api";
import { buildFeedQueryArgs } from "./actions";

const INITIAL_NUM_ITEMS = 20;

function FeedPublic({
  searchQuery,
  back = "/",
}: {
  searchQuery?: string;
  back?: string;
}) {
  const filterArgs = buildFeedQueryArgs(searchQuery);

  const { results, status, loadMore } = usePaginatedQuery(
    api.feed.fetchPublicFeed,
    filterArgs,
    { initialNumItems: INITIAL_NUM_ITEMS },
  );

  const isLoading = status === "LoadingFirstPage";
  const isFetchingNextPage = status === "LoadingMore";
  const hasNextPage = status === "CanLoadMore";

  // Intersection Observer for infinite scroll
  const observerMiddle = useRef<IntersectionObserver | null>(null);
  const observerLast = useRef<IntersectionObserver | null>(null);
  const sentinelMiddleIndex =
    results.length > 0 ? Math.floor(results.length / 2) : -1;
  const sentinelLastIndex = results.length > 0 ? results.length - 1 : -1;

  const sentinelMiddleRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerMiddle.current) observerMiddle.current.disconnect();
      observerMiddle.current = new window.IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          loadMore(INITIAL_NUM_ITEMS);
        }
      });
      if (node) observerMiddle.current.observe(node);
    },
    [isFetchingNextPage, loadMore, hasNextPage],
  );

  const sentinelLastRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerLast.current) observerLast.current.disconnect();
      observerLast.current = new window.IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          loadMore(INITIAL_NUM_ITEMS);
        }
      });
      if (node) observerLast.current.observe(node);
    },
    [isFetchingNextPage, loadMore, hasNextPage],
  );

  const handleScrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <>
      <ScrollToTopButton onScrollToTop={handleScrollToTop} />

      <div className="flex flex-col gap-4">
        {results.length === 0 && !isLoading && (
          <div className="text-muted-foreground">No activity yet.</div>
        )}
        {isLoading && (
          <div className="flex flex-row items-center gap-2 text-muted-foreground">
            <Loader className="animate-spin w-4 h-4" /> Loading...
          </div>
        )}
        {results.map((item, idx) => {
          const org = item.repository?.org ?? "";
          const repo = item.repository?.repo ?? "";
          let ref;
          if (hasNextPage) {
            if (idx === sentinelMiddleIndex) ref = sentinelMiddleRef;
            if (idx === sentinelLastIndex) ref = sentinelLastRef;
          }
          return (
            <div key={item._id} ref={ref}>
              <ActivityCard item={item} repo={repo} org={org} back={back} />
            </div>
          );
        })}
        {isFetchingNextPage && (
          <div className="flex flex-row items-center gap-2 text-muted-foreground">
            <Loader className="animate-spin w-4 h-4" /> Loading more...
          </div>
        )}
        {results.length > 0 && !hasNextPage && !isLoading && (
          <div className="text-muted-foreground text-center pb-4 text-sm">
            - End of feed -
          </div>
        )}
      </div>
    </>
  );
}

export default React.memo(FeedPublic);
