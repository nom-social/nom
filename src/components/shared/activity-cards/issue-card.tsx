import React from "react";
import { ShareIcon, CircleDot, CircleCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

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
import ContributorAvatarGroup, {
  Contributor,
} from "@/components/shared/contributor-avatar-group";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/utils";
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
              "border-transparent uppercase text-black",
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
            <div className="text-muted-foreground text-xs">
              <Link
                href={`/${org}/${repo}`}
                className="hover:underline focus:underline outline-none"
              >
                {org}/{repo}
              </Link>
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
          <Button
            variant="outline"
            aria-label={liked ? "Unlike Issue" : "Like Issue"}
            onClick={handleLikeClick}
            size="sm"
          >
            <span
              role="img"
              aria-label={liked ? "Like issue" : "Unlike issue"}
              style={{
                opacity: liked ? 1 : 0.4,
                fontSize: "1.25em",
                transition: "opacity 0.2s",
                marginRight: "0.25em",
                verticalAlign: "middle",
              }}
            >
              🚀
            </span>
            {formattedLikeCount}
          </Button>
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
