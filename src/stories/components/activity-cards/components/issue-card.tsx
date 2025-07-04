import React from "react";
import { CircleDot, CircleCheck } from "lucide-react";

import { Contributor } from "@/components/shared/contributor-avatar-group";
import ActivityCardBase from "@/components/shared/activity-card/shared/activity-card-base";
import { cn } from "@/lib/utils";

export type Props = {
  title: string;
  contributors: Contributor[];
  body: string;
  issueUrl: string;
  repo: string;
  org: string;
  state: "open" | "closed";
  createdAt: Date;
  likeCount: number | null;
  liked: boolean;
  onLike?: () => void;
  onUnlike?: () => void;
  hash: string;
  children?: React.ReactNode;
};

export default function IssueCard({
  title,
  contributors,
  body,
  issueUrl,
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
      titleUrl={issueUrl}
      badgeIcon={state === "open" ? <CircleDot /> : <CircleCheck />}
      badgeLabel={state}
      badgeClassName={cn(
        "border-transparent uppercase text-black",
        state === "open" ? "bg-nom-green" : "bg-nom-purple"
      )}
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
