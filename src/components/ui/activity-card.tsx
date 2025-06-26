import React from "react";
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
import { ShareIcon, ExternalLinkIcon, HeartIcon } from "lucide-react";
import { AvatarGroup, Contributor } from "@/components/ui/avatar-group";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/ui/markdown";

export type Props = {
  title: string;
  contributors: Contributor[];
  body: string;
  prUrl: string;
  repo: string;
  org: string;
  status: {
    state: string;
    type: "pr" | "issue" | "release";
    icon?: React.ReactNode;
    color: string;
  };
  ctaLabel: string;
};

export default function ActivityCard({
  title,
  contributors,
  body,
  prUrl,
  repo,
  org,
  status,
  ctaLabel,
}: Props) {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="leading-relaxed font-bold">
          <Markdown>{title}</Markdown>
        </CardTitle>
        <CardAction>
          <Badge
            className={`bg-[${status.color}] hover:opacity-90 border-transparent uppercase text-black`}
          >
            {status.icon}
            <>
              {status.type} • {status.state}
            </>
          </Badge>
        </CardAction>
        <CardDescription>
          <div className="flex gap-2 flex-col">
            <div className="text-muted-foreground text-sm">
              {org}/{repo}
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full">
          <div className="flex items-center gap-1 flex-wrap">
            <Button variant="outline" size="icon" className="size-8">
              <HeartIcon className="size-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <Button variant="outline" size="sm">
              <ShareIcon className="size-4" />
              Share
            </Button>
            <Button variant="default" size="sm" asChild>
              <a href={prUrl} target="_blank" rel="noopener noreferrer">
                {ctaLabel}
                <ExternalLinkIcon className="size-4" />
              </a>
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
