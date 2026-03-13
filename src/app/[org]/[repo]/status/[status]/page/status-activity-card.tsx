"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GitCommitVertical, GitMergeIcon, TagIcon } from "lucide-react";

import {
  prDataSchema,
  releaseDataSchema,
  pushDataSchema,
} from "@/components/shared/activity-card/shared/schemas";
import {
  createLike,
  deleteLike,
} from "@/components/shared/activity-card/actions";
import { NotAuthenticatedError } from "@/lib/errors";

import StatusActivityCardBase from "./status-activity-card-base";

interface FeedItem {
  _id: string;
  type: string;
  data: unknown;
  dedupeHash: string;
  likeCount: number;
  isLiked: boolean;
  repositories?: {
    org: string;
    repo: string;
  };
}

/**
 * Activity card for the status detail page. Title links to GitHub;
 * use this for extending status-page-specific behavior.
 */
function StatusActivityCard({
  item,
  repo,
  org,
  isPrivate = false,
}: {
  item: FeedItem;
  repo: string;
  org: string;
  isPrivate?: boolean;
}) {
  const router = useRouter();
  const [likeCount, setLikeCount] = useState<number>(item.likeCount);
  const [liked, setLiked] = useState<boolean>(item.isLiked);

  useEffect(() => {
    setLikeCount(item.likeCount);
    setLiked(item.isLiked);
  }, [item.likeCount, item.isLiked]);

  const handleLike = useCallback(async () => {
    try {
      await createLike(item.dedupeHash);
      setLiked(true);
      setLikeCount((prev) => prev + 1);
      toast.success("🔥 Liked!", { icon: null });
    } catch (error) {
      if (error instanceof NotAuthenticatedError)
        router.push(
          `/auth/login?next=${encodeURIComponent(window.location.pathname)}`,
        );
    }
  }, [item.dedupeHash, router]);

  const handleUnlike = useCallback(async () => {
    try {
      await deleteLike(item.dedupeHash);
      setLiked(false);
      setLikeCount((prev) => prev - 1);
      toast("💔 Un-liked!");
    } catch (error) {
      if (error instanceof NotAuthenticatedError)
        router.push(
          `/auth/login?next=${encodeURIComponent(window.location.pathname)}`,
        );
    }
  }, [item.dedupeHash, router]);

  if (item.type === "pull_request") {
    const parseResult = prDataSchema.safeParse(item.data);
    if (!parseResult.success) return null;
    const pr = parseResult.data.pull_request;

    return (
      <StatusActivityCardBase
        title={pr.title}
        titleUrl={pr.html_url}
        hideExternalLinks={isPrivate}
        badgeIcon={<GitMergeIcon />}
        badgeLabel={pr.merged ? "merged" : "open"}
        badgeClassName="bg-nom-purple border-transparent uppercase text-black"
        repo={repo}
        org={org}
        repoUrl={`/${org}/${repo}`}
        timestamp={new Date(pr.updated_at)}
        contributors={pr.contributors.map((login) => ({
          name: login,
          avatar: `https://github.com/${login}.png`,
        }))}
        body={pr.ai_summary}
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
      <StatusActivityCardBase
        title={release.name ?? release.tag_name}
        titleUrl={release.html_url}
        hideExternalLinks={isPrivate}
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
      <StatusActivityCardBase
        title={push.title}
        titleUrl={push.html_url}
        hideExternalLinks={isPrivate}
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

export default React.memo(StatusActivityCard);
