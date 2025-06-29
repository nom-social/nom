"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import PRCard from "@/components/activity-cards/pr-card";
import { prDataSchema } from "@/components/activity-cards/shared/schemas";
import { Button } from "@/components/ui/button";
import IssueCard from "@/components/activity-cards/issue-card";
import { issueDataSchema } from "@/components/activity-cards/shared/schemas";
import ReleaseCard from "@/components/activity-cards/release-card";
import { releaseDataSchema } from "@/components/activity-cards/shared/schemas";

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
              body={parseResult.data.pull_request.ai_summary}
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
        if (item.type === "issue") {
          const parseResult = issueDataSchema.safeParse(item.data);
          if (!parseResult.success) {
            return null;
          }

          return (
            <IssueCard
              key={item.id}
              title={parseResult.data.issue.title}
              contributors={parseResult.data.issue.contributors.map(
                (login) => ({
                  name: login,
                  avatar: `https://github.com/${login}.png`,
                })
              )}
              body={parseResult.data.issue.ai_summary}
              issueUrl={parseResult.data.issue.html_url}
              repo={repo}
              org={org}
              state={parseResult.data.issue.state}
              createdAt={new Date(parseResult.data.issue.created_at)}
              likeCount={0}
              liked={false}
            />
          );
        }
        if (item.type === "release") {
          const parseResult = releaseDataSchema.safeParse(item.data);
          if (!parseResult.success) {
            return null;
          }
          const release = parseResult.data.release;

          return (
            <ReleaseCard
              key={item.id}
              title={release.name || release.tag_name}
              contributors={parseResult.data.release.contributors.map(
                (login) => ({
                  name: login,
                  avatar: `https://github.com/${login}.png`,
                })
              )}
              releaseUrl={release.html_url}
              repo={repo}
              org={org}
              tagName={release.tag_name}
              publishedAt={
                release.published_at
                  ? new Date(release.published_at)
                  : new Date(release.created_at)
              }
              aiSummary={release.ai_summary}
              likeCount={0}
              liked={false}
            />
          );
        }

        return null;
      })}
      {hasNextPage && (
        <Button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          variant="ghost"
          className="mb-4"
        >
          {isFetchingNextPage ? <Loader2 className="animate-spin" /> : null}{" "}
          Load more
        </Button>
      )}
    </div>
  );
}
