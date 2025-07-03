"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  CircleCheck,
  CircleDot,
  GitCommitVertical,
  GitMergeIcon,
  TagIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Tables } from "@/types/supabase";
import {
  issueDataSchema,
  prDataSchema,
  releaseDataSchema,
  pushDataSchema,
} from "@/components/shared/activity-card/shared/schemas";
import { cn } from "@/lib/utils";

import {
  isLiked,
  createLike,
  deleteLike,
  NotAuthenticatedError,
  getLikeCount,
} from "./activity-card/actions";
import ActivityCardBase from "./activity-card/shared/activity-card-base";

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

  const handleLike = () => likeMutation.mutate({ hash: item.dedupe_hash });
  const handleUnlike = () => unlikeMutation.mutate({ hash: item.dedupe_hash });

  if (item.type === "pull_request") {
    const parseResult = prDataSchema.safeParse(item.data);
    if (!parseResult.success) {
      return null;
    }

    return (
      <ActivityCardBase
        title={parseResult.data.pull_request.title}
        titleUrl={parseResult.data.pull_request.html_url}
        badgeIcon={<GitMergeIcon />}
        badgeLabel={parseResult.data.pull_request.merged ? "merged" : "open"}
        badgeClassName="bg-[var(--nom-purple)] border-transparent uppercase text-black"
        repo={repo}
        org={org}
        repoUrl={`/${org}/${repo}`}
        timestamp={new Date(parseResult.data.pull_request.created_at)}
        timestampLabel={formatDistanceToNow(
          new Date(parseResult.data.pull_request.created_at),
          { addSuffix: false }
        )}
        contributors={parseResult.data.pull_request.contributors.map(
          (login) => ({
            name: login,
            avatar: `https://github.com/${login}.png`,
          })
        )}
        body={parseResult.data.pull_request.body ?? undefined}
        likeCount={likeCount}
        liked={liked}
        onLike={handleLike}
        onUnlike={handleUnlike}
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
      <ActivityCardBase
        title={parseResult.data.issue.title}
        titleUrl={parseResult.data.issue.html_url}
        badgeIcon={
          parseResult.data.issue.state === "open" ? (
            <CircleDot />
          ) : (
            <CircleCheck />
          )
        }
        badgeLabel={parseResult.data.issue.state}
        badgeClassName={cn(
          "border-transparent uppercase text-black",
          parseResult.data.issue.state === "open"
            ? "bg-[var(--nom-green)]"
            : "bg-[var(--nom-purple)]"
        )}
        repo={repo}
        org={org}
        repoUrl={`/${org}/${repo}`}
        timestamp={new Date(parseResult.data.issue.created_at)}
        timestampLabel={formatDistanceToNow(
          new Date(parseResult.data.issue.created_at),
          { addSuffix: false }
        )}
        contributors={parseResult.data.issue.contributors.map((login) => ({
          name: login,
          avatar: `https://github.com/${login}.png`,
        }))}
        body={parseResult.data.issue.body ?? undefined}
        likeCount={likeCount}
        liked={liked}
        onLike={handleLike}
        onUnlike={handleUnlike}
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
      <ActivityCardBase
        title={release.name ?? release.tag_name}
        titleUrl={release.html_url}
        badgeIcon={<TagIcon />}
        badgeLabel={release.tag_name}
        badgeClassName="bg-[var(--nom-blue)] border-transparent uppercase text-black"
        repo={repo}
        org={org}
        repoUrl={`/${org}/${repo}`}
        timestamp={new Date(release.published_at ?? release.created_at)}
        timestampLabel={formatDistanceToNow(
          new Date(release.published_at ?? release.created_at),
          { addSuffix: false }
        )}
        contributors={release.contributors.map((login) => ({
          name: login,
          avatar: `https://github.com/${login}.png`,
        }))}
        body={release.body ?? undefined}
        likeCount={likeCount}
        liked={liked}
        onLike={handleLike}
        onUnlike={handleUnlike}
        hash={item.dedupe_hash}
      />
    );
  }
  if (item.type === "push") {
    const parseResult = pushDataSchema.safeParse(item.data);
    if (!parseResult.success) {
      return null;
    }
    const push = parseResult.data.push;
    return (
      <ActivityCardBase
        title={push.title}
        titleUrl={push.html_url}
        badgeIcon={<GitCommitVertical />}
        badgeLabel="pushed"
        badgeClassName="bg-[var(--nom-green)] border-transparent uppercase text-black"
        repo={repo}
        org={org}
        repoUrl={`/${org}/${repo}`}
        timestamp={new Date(push.created_at)}
        timestampLabel={formatDistanceToNow(new Date(push.created_at), {
          addSuffix: false,
        })}
        contributors={push.contributors.map((login) => ({
          name: login,
          avatar: `https://github.com/${login}.png`,
        }))}
        body={push.ai_summary}
        likeCount={likeCount}
        liked={liked}
        onLike={handleLike}
        onUnlike={handleUnlike}
        hash={item.dedupe_hash}
      />
    );
  }

  return null;
}
