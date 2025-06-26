import React from "react";
import { ShareIcon, HeartIcon, CircleDot, CircleCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AvatarGroup, Contributor } from "@/components/shared/avatar-group";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/ui/markdown";
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
  likeCount: number;
  liked: boolean;
  onLike?: () => void;
  onUnlike?: () => void;
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
}: Props) {
  const handleLikeClick = () => {
    if (liked) {
      onUnlike?.();
    } else {
      onLike?.();
    }
  };
  const formattedLikeCount =
    likeCount > 0
      ? new Intl.NumberFormat(undefined, {
          notation: "compact",
        }).format(likeCount)
      : "0";

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="leading-relaxed font-bold">
          <a
            href={issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline focus:underline outline-none"
          >
            <Markdown>{title}</Markdown>
          </a>
        </CardTitle>
        <CardAction>
          <Badge
            className={cn(
              "hover:opacity-90 border-transparent uppercase text-black",
              state === "open"
                ? "bg-[var(--nom-green)]"
                : "bg-[var(--nom-purple)]"
            )}
          >
            {state === "open" ? <CircleDot /> : <CircleCheck />}
            {state}
          </Badge>
        </CardAction>
        <CardDescription>
          <div className="flex gap-2 flex-col">
            <div className="text-muted-foreground text-sm">
              <a
                href={`https://github.com/${org}/${repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline focus:underline outline-none"
              >
                {org}/{repo}
              </a>
              {" • "}
              {formatDistanceToNow(createdAt, { addSuffix: false })}
            </div>
            <div className="flex items-center">
              <AvatarGroup contributors={contributors} />
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm dark:prose-invert prose-neutral max-w-none font-normal">
          <Markdown>{body}</Markdown>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full justify-between">
          <Button
            variant="ghost"
            aria-label={liked ? "Unlike Issue" : "Like Issue"}
            onClick={handleLikeClick}
          >
            <HeartIcon
              className={liked ? "size-4 fill-red-500 text-red-500" : "size-4"}
            />
            {formattedLikeCount}
          </Button>
          <Button variant="outline" size="sm">
            <ShareIcon className="size-4" />
            Share
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
