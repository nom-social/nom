import React from "react";
import { GitMergeIcon } from "lucide-react";

import { Contributor } from "@/components/shared/contributor-avatar-group";
import ActivityCardBase from "@/components/shared/activity-card/shared/activity-card-base";

export type Props = {
  title: string;
  contributors: Contributor[];
  body: string;
  prUrl: string;
  repo: string;
  org: string;
  state: string;
  createdAt: Date;
  likeCount: number | null;
  liked: boolean;
  onLike?: () => void;
  onUnlike?: () => void;
  hash: string;
};

export default function PRCard({
  title,
  contributors,
  body,
  prUrl,
  repo,
  org,
  state,
  createdAt,
  likeCount,
  liked,
  onLike,
  onUnlike,
  hash,
}: Props) {
  return (
    <ActivityCardBase
      title={title}
      titleUrl={prUrl}
      badgeIcon={<GitMergeIcon />}
      badgeLabel={state}
      badgeClassName="bg-nom-purple border-transparent uppercase text-black"
      repo={repo}
      org={org}
      repoUrl={`/${org}/${repo}`}
      timestamp={createdAt}
      contributors={contributors}
      body={body}
      likeCount={likeCount}
      liked={liked}
      onLike={onLike}
      onUnlike={onUnlike}
      hash={hash}
    />
  );
}
