"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader, Search, X } from "lucide-react";
import React, { useRef, useCallback } from "react";
import { useForm } from "react-hook-form";

import ActivityCard from "@/components/shared/activity-card";
import ScrollToTopButton from "@/components/shared/scroll-to-top-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

import { fetchFeedPage, FetchFeedPageResult } from "./feed/actions";

const LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 300;

type RepoFeedItemsProps = {
  repoId: string;
  repo: string;
  org: string;
  searchQuery?: string;
};

function RepoFeedItems({ repoId, repo, org, searchQuery }: RepoFeedItemsProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery<FetchFeedPageResult, Error>({
    queryKey: [fetchFeedPage.key, repoId, searchQuery],
    queryFn: ({ pageParam }) => {
      const offset = typeof pageParam === "number" ? pageParam : 0;
      return fetchFeedPage({
        repoId,
        limit: LIMIT,
        offset,
        query: searchQuery,
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

  const handleScrollToTop = () => {
    refetch();
  };

  return (
    <>
      <ScrollToTopButton onScrollToTop={handleScrollToTop} />

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
          let ref;
          if (hasNextPage) {
            if (idx === sentinelMiddleIndex) ref = sentinelMiddleRef;
            if (idx === sentinelLastIndex) ref = sentinelLastRef;
          }
          return (
            <div key={item.id} ref={ref}>
              <ActivityCard
                item={item}
                repo={repo}
                org={org}
                back={`/${org}/${repo}`}
              />
            </div>
          );
        })}
        {isFetchingNextPage && (
          <div className="flex flex-row items-center gap-2 text-muted-foreground">
            <Loader className="animate-spin w-4 h-4" /> Loading more...
          </div>
        )}
        {items.length > 0 && !hasNextPage && !isLoading && (
          <div className="text-muted-foreground text-center pb-4 text-sm">
            - End of feed -
          </div>
        )}
      </div>
    </>
  );
}

const MemoizedRepoFeedItems = React.memo(RepoFeedItems);

export default function Feed({
  repoId,
  repo,
  org,
}: {
  repoId: string;
  repo: string;
  org: string;
}) {
  const { register, setValue, watch } = useForm<{
    search: string;
  }>({
    defaultValues: { search: "" },
  });

  const searchValue = watch("search");
  const activeQuery = useDebouncedValue(searchValue, SEARCH_DEBOUNCE_MS);

  const handleClear = () => {
    setValue("search", "");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-nom-green opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-nom-green" />
        </span>
        <span>Live activities</span>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search activities..."
          className="pl-10 pr-10 w-full"
          {...register("search")}
        />
        {searchValue && (
          <Button
            type="button"
            onClick={handleClear}
            size="icon"
            variant="ghost"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground focus:outline-none"
            tabIndex={-1}
          >
            <X />
          </Button>
        )}
      </div>

      <MemoizedRepoFeedItems
        repoId={repoId}
        repo={repo}
        org={org}
        searchQuery={activeQuery}
      />
    </div>
  );
}
