"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader, ArrowUp, Search, X } from "lucide-react";
import React, { useRef, useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import ActivityCard from "@/components/shared/activity-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

import { fetchFeedPage, FetchFeedPageResult } from "./feed/actions";

const LIMIT = 20;

export default function Feed({
  repoId,
  repo,
  org,
}: {
  repoId: string;
  repo: string;
  org: string;
  searchQuery?: string;
}) {
  const { register, handleSubmit, setValue, getValues } = useForm<{
    search: string;
  }>({
    defaultValues: { search: "" },
  });

  const [activeQuery, setActiveQuery] = useState("");
  const searchValue = getValues("search");

  const onSubmit = (data: { search: string }) => {
    setActiveQuery(data.search);
  };

  const handleClear = () => {
    setValue("search", "");
    setActiveQuery("");
  };

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
    queryKey: [fetchFeedPage.key, repoId, activeQuery],
    queryFn: ({ pageParam }) => {
      const offset = typeof pageParam === "number" ? pageParam : 0;
      return fetchFeedPage({
        repoId,
        limit: LIMIT,
        offset,
        query: activeQuery,
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

  // Scroll to top button state
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollToTop = () => {
    refetch();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Button
        aria-label="Scroll to top"
        onClick={handleScrollToTop}
        className={cn(
          "fixed left-1/2 -translate-x-1/2 top-10 z-70 border",
          "shadow-lg p-2 hover:bg-background/90",
          "active:scale-95 border-nom-yellow bg-background text-white",
          "transition-all duration-300 flex items-center justify-center hover:scale-105",
          showScrollTop
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none -translate-y-8 -translate-x-1/2"
        )}
        size="icon"
      >
        <ArrowUp className="w-5 h-5" />
      </Button>

      <div className="flex flex-col gap-4">
        <form className="relative" onSubmit={handleSubmit(onSubmit)}>
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
        </form>

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
          <div className="text-muted-foreground text-center pb-4 text-sm">
            - End of feed -
          </div>
        )}
      </div>
    </>
  );
}
