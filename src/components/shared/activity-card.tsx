"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { GitCommitVertical, GitMergeIcon, TagIcon } from "lucide-react";

import {
  prDataSchema,
  releaseDataSchema,
  pushDataSchema,
} from "@/components/shared/activity-card/shared/schemas";
import { api } from "@/../convex/_generated/api";

import ActivityCardBase from "./activity-card/shared/activity-card-base";

type FeedItemWithLikes = {
  _id: string;
  type: string;
  data: unknown;
  dedupeHash: string;
  likeCount: number;
  isLiked: boolean;
  repository?: {
    org: string;
    repo: string;
  } | null;
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
  const { isAuthenticated } = useConvexAuth();
  const statusBase = `/${org}/${repo}/status/${item.dedupeHash}`;
  const titleUrl = back
    ? `${statusBase}?back=${encodeURIComponent(back)}`
    : statusBase;
  const router = useRouter();
  const [likeCount, setLikeCount] = useState<number>(item.likeCount);
  const [liked, setLiked] = useState<boolean>(item.isLiked);

  useEffect(() => {
    setLikeCount(item.likeCount);
    setLiked(item.isLiked);
  }, [item.likeCount, item.isLiked]);

  const createLikeMutation = useMutation(api.likes.createLike);
  const deleteLikeMutation = useMutation(api.likes.deleteLike);

  const handleLike = useCallback(async () => {
    if (!isAuthenticated) {
      router.push(`/auth/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setLiked(true);
    setLikeCount((prev) => prev + 1);
    try {
      await createLikeMutation({ dedupeHash: item.dedupeHash });
      toast.success("🔥 Liked!", { icon: null });
    } catch {
      setLiked(false);
      setLikeCount((prev) => prev - 1);
    }
  }, [isAuthenticated, item.dedupeHash, createLikeMutation, router]);

  const handleUnlike = useCallback(async () => {
    if (!isAuthenticated) {
      router.push(`/auth/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setLiked(false);
    setLikeCount((prev) => prev - 1);
    try {
      await deleteLikeMutation({ dedupeHash: item.dedupeHash });
      toast("💔 Un-liked!");
    } catch {
      setLiked(true);
      setLikeCount((prev) => prev + 1);
    }
  }, [isAuthenticated, item.dedupeHash, deleteLikeMutation, router]);

  if (item.type === "pull_request") {
    const parseResult = prDataSchema.safeParse(item.data);
    if (!parseResult.success) return null;

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
          (login) => ({ name: login, avatar: `https://github.com/${login}.png` }),
        )}
        body={parseResult.data.pull_request.ai_summary}
        likeCount={likeCount}
        liked={liked}
        onLike={handleLike}
        onUnlike={handleUnlike}
        hash={item.dedupeHash}
      />
    );
  }
  if (item.type === "release") {
    const parseResult = releaseDataSchema.safeParse(item.data);
    if (!parseResult.success) return null;
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
        hash={item.dedupeHash}
      />
    );
  }
  if (item.type === "push") {
    const parseResult = pushDataSchema.safeParse(item.data);
    if (!parseResult.success) return null;
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
        hash={item.dedupeHash}
      />
    );
  }

  return null;
}

export default React.memo(ActivityCard);
