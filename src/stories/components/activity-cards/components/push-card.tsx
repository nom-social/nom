import React from "react";
import { GitCommitVertical } from "lucide-react";

import { Contributor } from "@/components/shared/contributor-avatar-group";
import ActivityCardBase from "@/components/shared/activity-card/shared/activity-card-base";

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
      badgeClassName="bg-nom-green border-transparent uppercase text-black"
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
