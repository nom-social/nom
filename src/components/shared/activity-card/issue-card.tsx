import React from "react";
import { CircleDot, CircleCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Contributor } from "@/components/shared/contributor-avatar-group";
import { cn } from "@/lib/utils";

import ActivityCardBase from "./shared/ActivityCardBase";

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
        state === "open" ? "bg-[var(--nom-green)]" : "bg-[var(--nom-purple)]"
      )}
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
      likeAriaLabel={liked ? "Unlike Issue" : "Like Issue"}
      hash={hash}
    />
  );
}
