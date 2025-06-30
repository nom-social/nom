"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import PRCard from "@/components/shared/activity-cards/pr-card";
import IssueCard from "@/components/shared/activity-cards/issue-card";
import ReleaseCard from "@/components/shared/activity-cards/release-card";
import { Tables } from "@/types/supabase";
import { issueDataSchema } from "@/components/shared/activity-cards/shared/schemas";
import { prDataSchema } from "@/components/shared/activity-cards/shared/schemas";
import { releaseDataSchema } from "@/components/shared/activity-cards/shared/schemas";
import {
  isLiked,
  createLike,
  deleteLike,
  NotAuthenticatedError,
  getLikeCount,
} from "./activity-card/actions";

export default function ActivityCard({
  item,
  repo,
  org,
}: {
  item: Tables<"public_timeline"> | Tables<"user_timeline">;
  repo: string;
  org: string;
}) {
  const router = useRouter();
  const [likeCount, setLikeCount] = useState<number | null>(null);

  const { data: likeData, refetch: refetchLike } = useQuery({
    queryKey: [isLiked.key, item.dedupe_hash],
    queryFn: () => isLiked(item.dedupe_hash),
    refetchOnWindowFocus: false,
  });
  const getLikeCountQuery = useQuery({
    queryKey: [getLikeCount.key, item.dedupe_hash],
    queryFn: () => getLikeCount(item.dedupe_hash),
    refetchOnWindowFocus: false,
  });

  const likeMutation = useMutation({
    mutationFn: ({ hash }: { hash: string }) => createLike(hash),
    onSuccess: async () => {
      await refetchLike();
      setLikeCount((prev) => (prev ?? 0) + 1);
      toast.success("🔥 Liked!", { icon: null });
    },
    onError: (error) => {
      if (error instanceof NotAuthenticatedError)
        router.push(
          `/auth/login?next=${encodeURIComponent(window.location.pathname)}`
        );
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: ({ hash }: { hash: string }) => deleteLike(hash),
    onSuccess: async () => {
      await refetchLike();
      setLikeCount((prev) => (prev ?? 0) - 1);
      toast("💔 Un-liked!");
    },
    onError: (error) => {
      if (error instanceof NotAuthenticatedError)
        router.push(
          `/auth/login?next=${encodeURIComponent(window.location.pathname)}`
        );
    },
  });

  useEffect(() => {
    if (getLikeCountQuery.data !== undefined)
      setLikeCount(getLikeCountQuery.data);
  }, [getLikeCountQuery.data]);

  const liked = likeData?.liked ?? false;

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
        createdAt={new Date(parseResult.data.pull_request.updated_at)}
        likeCount={likeCount}
        liked={liked}
        onLike={() => likeMutation.mutate({ hash: item.dedupe_hash })}
        onUnlike={() => unlikeMutation.mutate({ hash: item.dedupe_hash })}
        hash={item.dedupe_hash}
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
        contributors={parseResult.data.issue.contributors.map((login) => ({
          name: login,
          avatar: `https://github.com/${login}.png`,
        }))}
        body={parseResult.data.issue.ai_summary}
        issueUrl={parseResult.data.issue.html_url}
        repo={repo}
        org={org}
        state={parseResult.data.issue.state}
        createdAt={new Date(parseResult.data.issue.updated_at)}
        likeCount={likeCount}
        liked={liked}
        onLike={() => likeMutation.mutate({ hash: item.dedupe_hash })}
        onUnlike={() => unlikeMutation.mutate({ hash: item.dedupe_hash })}
        hash={item.dedupe_hash}
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
        contributors={parseResult.data.release.contributors.map((login) => ({
          name: login,
          avatar: `https://github.com/${login}.png`,
        }))}
        releaseUrl={release.html_url}
        repo={repo}
        org={org}
        tagName={release.tag_name}
        publishedAt={
          release.published_at
            ? new Date(release.published_at)
            : new Date(release.created_at)
        }
        body={release.ai_summary}
        likeCount={likeCount}
        liked={liked}
        onLike={() => likeMutation.mutate({ hash: item.dedupe_hash })}
        onUnlike={() => unlikeMutation.mutate({ hash: item.dedupe_hash })}
        hash={item.dedupe_hash}
      />
    );
  }

  return null;
}
