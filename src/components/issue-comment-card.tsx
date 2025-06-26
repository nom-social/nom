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
  issueTitle: string;
  commentBody: string;
  commenter: Contributor[];
  issueUrl: string;
  repo: string;
  org: string;
  state: "open" | "closed";
  createdAt: Date;
};

export default function IssueCommentCard({
  issueTitle,
  commentBody,
  commenter,
  issueUrl,
  repo,
  org,
  state,
  createdAt,
}: Props) {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="leading-relaxed font-bold">
          <a
            href={issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline focus:underline outline-none"
          >
            <Markdown>{issueTitle}</Markdown>
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
            Issue Comment • {state}
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
              <AvatarGroup contributors={commenter} />
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm dark:prose-invert prose-neutral max-w-none font-normal">
          <Markdown>{commentBody}</Markdown>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full justify-between">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Like comment"
          >
            <HeartIcon className="size-4" />
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
