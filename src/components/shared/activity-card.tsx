"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { GitCommitVertical, GitMergeIcon, TagIcon } from "lucide-react";

import { Tables } from "@/types/supabase";
import {
  prDataSchema,
  releaseDataSchema,
  pushDataSchema,
} from "@/components/shared/activity-card/shared/schemas";

import { deleteLike, NotAuthenticatedError } from "./activity-card/actions";
import { createLike } from "./activity-card/server-actions";
import ActivityCardBase from "./activity-card/shared/activity-card-base";

type FeedItemWithLikes = (
  | Tables<"public_timeline">
  | Tables<"user_timeline">
) & {
  likeCount: number;
  isLiked: boolean;
  repositories?: {
    org: string;
    repo: string;
  };
};

function ActivityCard({
  item,
  repo,
  org,
  back,
}: {
  item: FeedItemWithLikes;
  repo: string;
  org: string;
  back?: string;
}) {
  const statusBase = `/${org}/${repo}/status/${item.dedupe_hash}`;
  const titleUrl = back
    ? `${statusBase}?back=${encodeURIComponent(back)}`
    : statusBase;
  const router = useRouter();
  const [likeCount, setLikeCount] = useState<number>(item.likeCount);
  const [liked, setLiked] = useState<boolean>(item.isLiked);

  // Update local state when props change (useful for refetching)
  useEffect(() => {
    setLikeCount(item.likeCount);
    setLiked(item.isLiked);
  }, [item.likeCount, item.isLiked]);

  const { mutate: mutateLike } = useMutation({
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

  const { mutate: mutateUnlike } = useMutation({
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

  const handleLike = useCallback(
    () => mutateLike({ hash: item.dedupe_hash }),
    [item.dedupe_hash, mutateLike]
  );
  const handleUnlike = useCallback(
    () => mutateUnlike({ hash: item.dedupe_hash }),
    [item.dedupe_hash, mutateUnlike]
  );

  if (item.type === "pull_request") {
    const parseResult = prDataSchema.safeParse(item.data);
    if (!parseResult.success) {
      return null;
    }

    return (
      <ActivityCardBase
        title={parseResult.data.pull_request.title}
        titleUrl={titleUrl}
        pathToRestore={back ?? undefined}
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
  if (item.type === "release") {
    const parseResult = releaseDataSchema.safeParse(item.data);
    if (!parseResult.success) {
      return null;
    }
    const release = parseResult.data.release;

    return (
      <ActivityCardBase
        title={release.name ?? release.tag_name}
        titleUrl={titleUrl}
        pathToRestore={back ?? undefined}
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
        titleUrl={titleUrl}
        pathToRestore={back ?? undefined}
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

export default React.memo(ActivityCard);
