import React from "react";
import { TagIcon } from "lucide-react";

import { Contributor } from "@/components/shared/contributor-avatar-group";
import ActivityCardBase from "@/components/shared/activity-card/shared/activity-card-base";

export type Props = {
  title: string;
  contributors: Contributor[];
  releaseUrl: string;
  repo: string;
  org: string;
  tagName: string;
  publishedAt: Date;
  body: string;
  likeCount: number | null;
  liked: boolean;
  onLike?: () => void;
  onUnlike?: () => void;
  hash: string;
  children?: React.ReactNode;
};

export default function ReleaseCard({
  title,
  contributors,
  releaseUrl,
  repo,
  org,
  tagName,
  publishedAt,
  body,
  likeCount,
  liked,
  onLike,
  onUnlike,
  hash,
}: Props) {
  return (
    <ActivityCardBase
      title={title}
      titleUrl={releaseUrl}
      badgeIcon={<TagIcon />}
      badgeLabel={tagName}
      badgeClassName="bg-[var(--nom-blue)] border-transparent uppercase text-black"
      repo={repo}
      org={org}
      repoUrl={`/${org}/${repo}`}
      timestamp={publishedAt}
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
