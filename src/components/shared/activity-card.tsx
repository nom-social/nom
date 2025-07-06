"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  CircleCheck,
  CircleDot,
  GitCommitVertical,
  GitMergeIcon,
  TagIcon,
} from "lucide-react";

import { Tables } from "@/types/supabase";
import {
  issueDataSchema,
  prDataSchema,
  releaseDataSchema,
  pushDataSchema,
} from "@/components/shared/activity-card/shared/schemas";
import { cn } from "@/lib/utils";

import {
  createLike,
  deleteLike,
  NotAuthenticatedError,
} from "./activity-card/actions";
import ActivityCardBase from "./activity-card/shared/activity-card-base";

export default function ActivityCard({
  item,
  repo,
  org,
  initialLikeCount,
  initialIsLiked,
}: {
  item: Tables<"public_timeline"> | Tables<"user_timeline">;
  repo: string;
  org: string;
  initialLikeCount: number;
  initialIsLiked: boolean;
}) {
  const router = useRouter();
  const [likeCount, setLikeCount] = useState<number>(initialLikeCount);
  const [liked, setLiked] = useState<boolean>(initialIsLiked);

  // Update local state when props change (useful for refetching)
  useEffect(() => {
    setLikeCount(initialLikeCount);
    setLiked(initialIsLiked);
  }, [initialLikeCount, initialIsLiked]);

  const likeMutation = useMutation({
    mutationFn: ({ hash }: { hash: string }) => createLike(hash),
    onSuccess: async () => {
      setLiked(true);
      setLikeCount((prev) => prev + 1);
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
      setLiked(false);
      setLikeCount((prev) => prev - 1);
      toast("💔 Un-liked!");
    },
    onError: (error) => {
      if (error instanceof NotAuthenticatedError)
        router.push(
          `/auth/login?next=${encodeURIComponent(window.location.pathname)}`
        );
    },
  });

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
        badgeClassName="bg-nom-purple border-transparent uppercase text-black"
        repo={repo}
        org={org}
        repoUrl={`/${org}/${repo}`}
        timestamp={new Date(parseResult.data.pull_request.updated_at)}
        contributors={parseResult.data.pull_request.contributors.map(
          (login) => ({
            name: login,
            avatar: `https://github.com/${login}.png`,
          })
        )}
        body={parseResult.data.pull_request.ai_summary}
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
            ? "bg-nom-green"
            : "bg-nom-purple"
        )}
        repo={repo}
        org={org}
        repoUrl={`/${org}/${repo}`}
        timestamp={new Date(parseResult.data.issue.updated_at)}
        contributors={parseResult.data.issue.contributors.map((login) => ({
          name: login,
          avatar: `https://github.com/${login}.png`,
        }))}
        body={parseResult.data.issue.ai_summary}
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
        badgeClassName="bg-nom-blue border-transparent uppercase text-black"
        repo={repo}
        org={org}
        repoUrl={`/${org}/${repo}`}
        timestamp={new Date(release.published_at ?? release.created_at)}
        contributors={release.contributors.map((login) => ({
          name: login,
          avatar: `https://github.com/${login}.png`,
        }))}
        body={release.ai_summary}
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
        badgeClassName="bg-nom-green border-transparent uppercase text-black"
        repo={repo}
        org={org}
        repoUrl={`/${org}/${repo}`}
        timestamp={new Date(push.created_at)}
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
