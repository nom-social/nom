import React from "react";
import { ShareIcon, HeartIcon, GitMergeIcon } from "lucide-react";
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
import { AvatarGroup, Contributor } from "@/components/shared/avatar-group";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/ui/markdown";
import { Button } from "@/components/ui/button";

export type Props = {
  title: string;
  contributors: Contributor[];
  body: string;
  prUrl: string;
  repo: string;
  org: string;
  state: string;
  createdAt: Date;
  likeCount: number;
  liked: boolean;
  onLike?: () => void;
  onUnlike?: () => void;
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
    <Card className="w-full gap-4">
      <CardHeader>
        <CardTitle className="leading-relaxed font-bold">
          <a
            href={prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline focus:underline outline-none"
          >
            <Markdown>{title}</Markdown>
          </a>
        </CardTitle>
        <CardAction>
          <Badge className="bg-[var(--nom-purple)] hover:opacity-90 border-transparent uppercase text-black">
            <GitMergeIcon />
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
        <div className="prose prose-sm dark:prose-invert prose-neutral max-w-none font-normal text-sm">
          <Markdown>{body}</Markdown>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              aria-label={liked ? "Unlike PR" : "Like PR"}
              onClick={handleLikeClick}
              size="sm"
            >
              <HeartIcon className={liked ? "fill-red-500 text-red-500" : ""} />
              {formattedLikeCount}
            </Button>
          </div>
          <Button variant="outline" size="sm">
            <ShareIcon className="size-4" />
            Share
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
