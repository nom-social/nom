"use client";

import { usePaginatedQuery } from "convex/react";
import { Loader, Search, X } from "lucide-react";
import React, { useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";

import ActivityCard from "@/components/shared/activity-card";
import ScrollToTopButton from "@/components/shared/scroll-to-top-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBackUrl } from "@/hooks/use-back-url";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useScrollRestore } from "@/hooks/use-scroll-restore";
import { useSyncParamToUrl } from "@/hooks/use-sync-param-to-url";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import {
  buildFeedQueryArgs,
  type PublicFeedItemWithLikes,
} from "@/app/page/feed/actions";

const INITIAL_NUM_ITEMS = 20;
const SEARCH_DEBOUNCE_MS = 300;

function RepoFeedItems({
  repositoryId,
  repo,
  org,
  searchQuery,
  back,
  initialItems = [],
}: {
  repositoryId: Id<"repositories">;
  repo: string;
  org: string;
  searchQuery?: string;
  back: string;
  initialItems?: PublicFeedItemWithLikes[];
}) {
  const filterArgs = buildFeedQueryArgs(searchQuery, repositoryId);

  const { results, status, loadMore } = usePaginatedQuery(
    api.feed.fetchPublicFeed,
    filterArgs,
    { initialNumItems: INITIAL_NUM_ITEMS },
  );

  const isLoading = status === "LoadingFirstPage";
  const isFetchingNextPage = status === "LoadingMore";
  const hasNextPage = status === "CanLoadMore";

  // Show SSR-fetched items during initial load (only when no active search)
  const items =
    isLoading && !searchQuery ? (initialItems as typeof results) : results;

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
        if (entries[0].isIntersecting && hasNextPage)
          loadMore(INITIAL_NUM_ITEMS);
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
        if (entries[0].isIntersecting && hasNextPage)
          loadMore(INITIAL_NUM_ITEMS);
      });
      if (node) observerLast.current.observe(node);
    },
    [isFetchingNextPage, loadMore, hasNextPage],
  );

  return (
    <>
      <ScrollToTopButton
        onScrollToTop={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      />
      <div className="flex flex-col gap-4">
        {items.length === 0 && !isLoading && (
          <div className="text-muted-foreground">No activity yet.</div>
        )}
        {isLoading && items.length === 0 && (
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

const MemoizedRepoFeedItems = React.memo(RepoFeedItems);

export default function Feed({
  repositoryId,
  repo,
  org,
  initialItems = [],
}: {
  repositoryId: Id<"repositories">;
  repo: string;
  org: string;
  initialItems?: PublicFeedItemWithLikes[];
}) {
  useScrollRestore();
  const searchParams = useSearchParams();
  const qFromUrl = searchParams.get("q") ?? "";

  const { register, setValue, watch } = useForm<{ search: string }>({
    defaultValues: { search: qFromUrl },
  });
  const searchValue = watch("search");
  const activeQuery = useDebouncedValue(searchValue, SEARCH_DEBOUNCE_MS);
  useSyncParamToUrl("q", activeQuery);
  const backUrl = useBackUrl();

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
            onClick={() => setValue("search", "")}
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
        repositoryId={repositoryId}
        repo={repo}
        org={org}
        searchQuery={activeQuery}
        back={backUrl}
        initialItems={initialItems}
      />
    </div>
  );
}
