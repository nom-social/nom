"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import PRCard from "@/components/activity-cards/pr-card";
import { prDataSchema } from "@/components/activity-cards/shared/schemas";

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

  const items =
    data?.pages.flatMap((page) => (page as FetchFeedPageResult).items) ?? [];

  return (
    <div className="flex flex-col gap-4">
      {items.length === 0 && (
        <div className="text-muted-foreground">No activity yet.</div>
      )}
      {items.map((item) => {
        if (item.type === "pull_request") {
          const parseResult = prDataSchema.safeParse(item.data);
          if (!parseResult.success) {
            return null;
          }

          return (
            <PRCard
              key={item.id}
              title={parseResult.data.pull_request.title}
              contributors={parseResult.data.pull_request.contributors.map(
                (login) => ({
                  name: login,
                  avatar: `https://github.com/${login}.png`,
                })
              )}
              body={
                parseResult.data.pull_request.body ||
                parseResult.data.pull_request.ai_analysis?.summary ||
                ""
              }
              prUrl={parseResult.data.pull_request.html_url}
              repo={repo}
              org={org}
              state={parseResult.data.pull_request.merged ? "merged" : "open"}
              createdAt={new Date(parseResult.data.pull_request.created_at)}
              likeCount={0}
              liked={false}
            />
          );
        }
        // TODO: Add support for IssueCard, ReleaseCard, etc.
        return null;
      })}
      {/* TODO: add better infinite loader */}
      {hasNextPage && (
        <button
          className="mt-4 px-4 py-2 rounded bg-primary text-primary-foreground"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? "Loading more..." : "Load More"}
        </button>
      )}
    </div>
  );
}
