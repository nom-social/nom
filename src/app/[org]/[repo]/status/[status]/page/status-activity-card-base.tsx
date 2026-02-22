import React, { memo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ExternalLink, LinkIcon, ShareIcon } from "lucide-react";

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
import { useShare } from "@/hooks/use-share";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import X from "@/components/ui/icons/x";
import { cn } from "@/lib/utils";

export type StatusActivityCardBaseProps = {
  title: string;
  titleUrl: string;
  badgeIcon: React.ReactNode;
  badgeLabel: string;
  badgeClassName: string;
  repo: string;
  org: string;
  repoUrl: string;
  timestamp: Date;
  contributors: Contributor[];
  body: string;
  likeCount: number | null;
  liked: boolean;
  onLike?: () => void;
  onUnlike?: () => void;
  hash: string;
};

function StatusActivityCardBase({
  title,
  titleUrl,
  badgeIcon,
  badgeLabel,
  badgeClassName,
  repo,
  org,
  repoUrl,
  timestamp,
  contributors,
  body,
  likeCount,
  liked,
  onLike,
  onUnlike,
  hash,
}: StatusActivityCardBaseProps) {
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
        <CardTitle className="leading-relaxed font-bold break-words [word-break:break-word]">
          {titleUrl.startsWith("http") ? (
            <a
              href={titleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline focus:underline outline-none"
            >
              <span className="inline [&_p]:inline">
                <Markdown>{title}</Markdown>
                <span className="inline-block align-middle ml-1.5 mt-[-0.125em]">
                  <ExternalLink className="size-4" aria-hidden />
                </span>
              </span>
            </a>
          ) : (
            <Link
              href={titleUrl}
              className="hover:underline focus:underline outline-none"
            >
              <Markdown>{title}</Markdown>
            </Link>
          )}
        </CardTitle>
        <CardAction>
          <Badge className={cn(badgeClassName, "max-w-[120px]")}>
            <span className="shrink-0 inline-flex size-3 [&>svg]:size-full">
              {badgeIcon}
            </span>
            <span className="truncate min-w-0">{badgeLabel}</span>
          </Badge>
        </CardAction>
        <CardDescription>
          <div className="flex gap-2 flex-col">
            <div className="text-muted-foreground text-xs flex flex-wrap items-center gap-x-1">
              <Link
                href={repoUrl}
                className="hover:underline focus:underline outline-none"
              >
                {org}/{repo}
              </Link>
              {" • "}
              <span>{format(new Date(timestamp), "h:mm a - MMM d, yyyy")}</span>
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
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ShareIcon className="size-4" />
                Share
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  share(
                    `${window.location.origin}/${org}/${repo}/status/${hash}`,
                    title
                  )
                }
              >
                <LinkIcon />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    body
                  )}`;
                  window.open(tweetUrl, "_blank");
                }}
              >
                <X />
                Post on X
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardFooter>
    </Card>
  );
}

export default memo(StatusActivityCardBase);
