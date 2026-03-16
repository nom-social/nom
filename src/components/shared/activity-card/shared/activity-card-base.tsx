import React, { memo, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { LinkIcon, Linkedin, ShareIcon } from "lucide-react";

import {
  Card,
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
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import X from "@/components/ui/icons/x";
import { cn } from "@/lib/utils";
import StatusActivityCardBase from "@/app/[org]/[repo]/status/[status]/page/status-activity-card-base";

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
  contributors: Contributor[];
  body: string;
  likeCount: number | null;
  liked: boolean;
  onLike?: () => void;
  onUnlike?: () => void;
  hash: string;
  githubUrl?: string;
};

function ActivityCardBase({
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
  githubUrl,
}: Props) {
  const share = useShare();
  const [dialogOpen, setDialogOpen] = useState(false);
  // Tracks whether *this* card pushed a history entry, so we can distinguish
  // our own popstate events from unrelated navigation.
  const dialogOpenRef = useRef(false);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.nomDialogHash === hash) {
        // Forward navigation back to this dialog's URL — reopen it.
        dialogOpenRef.current = true;
        setDialogOpen(true);
      } else if (dialogOpenRef.current) {
        // Back navigation away from this dialog's URL — close it.
        dialogOpenRef.current = false;
        setDialogOpen(false);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [hash]);

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
          likeCount,
        )
      : "--";

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <Badge className={cn(badgeClassName, "self-start")}>
            <span className="shrink-0 inline-flex size-3 [&>svg]:size-full">
              {badgeIcon}
            </span>
            <span>{badgeLabel}</span>
          </Badge>
          <CardTitle className="leading-relaxed font-bold break-words [word-break:break-word]">
            <a
              href={titleUrl}
              aria-haspopup="dialog"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                e.preventDefault();
                window.history.pushState({ nomDialogHash: hash }, "", titleUrl);
                dialogOpenRef.current = true;
                setDialogOpen(true);
              }}
              className="text-left hover:underline focus:underline outline-none cursor-pointer"
            >
              <Markdown>{title}</Markdown>
            </a>
          </CardTitle>
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
                <span>
                  {formatDistanceToNow(new Date(timestamp), {
                    addSuffix: false,
                  })}
                </span>
                {githubUrl && (
                  <>
                    {" • "}
                    <a
                      href={githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline focus:underline outline-none inline-flex items-center gap-1"
                    >
                      view on GitHub
                    </a>
                  </>
                )}
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
                      title,
                    )
                  }
                >
                  <LinkIcon />
                  Copy link
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                      body,
                    )}`;
                    window.open(tweetUrl, "_blank");
                  }}
                >
                  <X />
                  Post on X
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const linkedInUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(body)}`;
                    window.open(linkedInUrl, "_blank");
                  }}
                >
                  <Linkedin />
                  Post on LinkedIn
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardFooter>
      </Card>
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open && dialogOpenRef.current) {
            // User closed the dialog manually (Esc / backdrop / close button).
            // Pop the history entry we pushed so the URL reverts automatically.
            dialogOpenRef.current = false;
            window.history.back();
          }
          setDialogOpen(open);
        }}
      >
        <DialogContent className="p-0 overflow-y-auto rounded-none top-0 left-0 translate-x-0 translate-y-0 w-full max-w-full h-full max-h-screen sm:rounded-lg sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:max-w-2xl sm:w-auto sm:h-auto sm:max-h-[90vh]">
          <VisuallyHidden.Root>
            <DialogTitle>{title}</DialogTitle>
          </VisuallyHidden.Root>
          <StatusActivityCardBase
            title={title}
            titleUrl={githubUrl}
            badgeIcon={badgeIcon}
            badgeLabel={badgeLabel}
            badgeClassName={badgeClassName}
            repo={repo}
            org={org}
            repoUrl={repoUrl}
            timestamp={timestamp}
            contributors={contributors}
            body={body}
            likeCount={likeCount}
            liked={liked}
            onLike={onLike}
            onUnlike={onUnlike}
            hash={hash}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default memo(ActivityCardBase);
