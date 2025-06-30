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
import ContributorAvatarGroup, {
  Contributor,
} from "@/components/shared/contributor-avatar-group";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/ui/markdown";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useShare } from "@/hooks/use-share";

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
  const handleLikeClick = () => {
    if (liked) {
      onUnlike?.();
    } else {
      onLike?.();
    }
  };
  const share = useShare();

  const formattedLikeCount =
    likeCount !== null
      ? new Intl.NumberFormat(undefined, {
          notation: "compact",
        }).format(likeCount)
      : "--";

  return (
    <Card className="w-full">
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
            <div className="text-muted-foreground text-xs">
              <a
                href={`https://github.com/${org}/${repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline focus:underline outline-none"
              >
                {org}/{repo}
              </a>
              {" • "}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    {formatDistanceToNow(createdAt, { addSuffix: false })}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {createdAt instanceof Date
                    ? createdAt.toLocaleString()
                    : new Date(createdAt).toLocaleString()}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center">
              <ContributorAvatarGroup contributors={contributors} />
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
        <div className="flex flex-row items-center gap-3 sm:gap-4 w-full justify-between">
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
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              share(
                `${window.location.origin}/${org}/${repo}/status/${hash}`,
                title
              )
            }
          >
            <ShareIcon className="size-4" />
            Share
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
