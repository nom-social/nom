import React from "react";
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
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/ui/markdown";
import { Button } from "@/components/ui/button";
import ContributorAvatarGroup, {
  Contributor,
} from "@/components/shared/contributor-avatar-group";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useShare } from "@/hooks/use-share";
import { ShareIcon } from "lucide-react";

export type Props = {
  title: string;
  titleUrl: string;
  badgeIcon: React.ReactNode;
  badgeLabel: string;
  badgeClassName: string;
  repo: string;
  org: string;
  repoUrl: string;
  timestamp: Date;
  timestampLabel?: string;
  contributors: Contributor[];
  body?: string;
  likeCount: number | null;
  liked: boolean;
  onLike?: () => void;
  onUnlike?: () => void;
  hash: string;
};

export default function ActivityCardBase({
  title,
  titleUrl,
  badgeIcon,
  badgeLabel,
  badgeClassName,
  repo,
  org,
  repoUrl,
  timestamp,
  timestampLabel,
  contributors,
  body,
  likeCount,
  liked,
  onLike,
  onUnlike,
  hash,
}: Props) {
  const share = useShare();

  const handleLikeClick = () => {
    if (liked) {
      onUnlike?.();
    } else {
      onLike?.();
    }
  };

  const formattedLikeCount =
    likeCount !== null
      ? new Intl.NumberFormat(undefined, { notation: "compact" }).format(
          likeCount
        )
      : "--";

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="leading-relaxed font-bold">
          <a
            href={titleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline focus:underline outline-none"
          >
            <Markdown>{title}</Markdown>
          </a>
        </CardTitle>
        <CardAction>
          <Badge className={badgeClassName}>
            {badgeIcon}
            {badgeLabel}
          </Badge>
        </CardAction>
        <CardDescription>
          <div className="flex gap-2 flex-col">
            <div className="text-muted-foreground text-xs">
              <Link
                href={repoUrl}
                className="hover:underline focus:underline outline-none"
              >
                {org}/{repo}
              </Link>
              {" • "}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>{timestampLabel}</span>
                </TooltipTrigger>
                <TooltipContent>
                  {timestamp instanceof Date
                    ? timestamp.toLocaleString()
                    : new Date(timestamp).toLocaleString()}
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
        {body && (
          <div className="prose prose-sm dark:prose-invert prose-neutral max-w-none font-normal text-sm">
            <Markdown>{body}</Markdown>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex flex-row items-center gap-3 sm:gap-4 w-full justify-between">
          <Button
            variant="outline"
            aria-label={liked ? "Unlike" : "Like"}
            onClick={handleLikeClick}
            size="sm"
          >
            <span
              role="img"
              aria-label={liked ? "Unlike" : "Like"}
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
