import React from "react";
import { GitCommitVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Contributor } from "@/components/shared/contributor-avatar-group";

import ActivityCardBase from "./shared/activity-card-base";

export type Props = {
  title: string;
  contributors: Contributor[];
  body: string;
  pushUrl: string;
  repo: string;
  org: string;
  createdAt: Date;
  likeCount: number | null;
  liked: boolean;
  onLike?: () => void;
  onUnlike?: () => void;
  hash: string;
  children?: React.ReactNode;
};

export default function PushCard({
  title,
  contributors,
  body,
  pushUrl,
  repo,
  org,
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
      titleUrl={pushUrl}
      badgeIcon={<GitCommitVertical />}
      badgeLabel="pushed"
      badgeClassName="bg-[var(--nom-green)] border-transparent uppercase text-black"
      repo={repo}
      org={org}
      repoUrl={`/${org}/${repo}`}
      timestamp={createdAt}
      timestampLabel={formatDistanceToNow(createdAt, { addSuffix: false })}
      contributors={contributors}
      body={body}
      likeCount={likeCount}
      liked={liked}
      onLike={onLike}
      onUnlike={onUnlike}
      likeAriaLabel={liked ? "Unlike Push" : "Like Push"}
      hash={hash}
    />
  );
}
