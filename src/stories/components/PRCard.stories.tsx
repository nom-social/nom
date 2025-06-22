import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  GitPullRequestIcon,
  GitMergeIcon,
  FileIcon,
  MessageSquareIcon,
  GitCommitIcon,
  ShareIcon,
  ExternalLinkIcon,
  HeartIcon,
} from "lucide-react";
import Image from "next/image";

interface PRCardProps {
  title: string;
  author: {
    name: string;
    avatar: string;
  };
  sourceBranch: string;
  targetBranch: string;
  status: "opened" | "merged";
  summary: string;
  stats: {
    filesChanged: number;
    additions: number;
    deletions: number;
    commits: number;
    comments: number;
  };
  prUrl: string;
}

const PRCard = ({
  title,
  author,
  sourceBranch,
  targetBranch,
  status,
  summary,
  stats,
  prUrl,
}: PRCardProps) => {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar className="mt-1">
            <AvatarImage src={author.avatar} alt={author.name} />
            <AvatarFallback>{author.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1.5">
            <CardTitle className="pr-8">{title}</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <div className="flex items-center gap-2">
                <span>{author.name}</span>
                <span>wants to merge</span>
              </div>
              <div className="flex items-center gap-2 min-w-0 w-full">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <code className="truncate px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground flex-shrink min-w-0 max-w-[45%]">
                      {sourceBranch}
                    </code>
                  </TooltipTrigger>
                  <TooltipContent>{sourceBranch}</TooltipContent>
                </Tooltip>
                <span className="flex-shrink-0">→</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <code className="truncate px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground flex-shrink min-w-0 max-w-[45%]">
                      {targetBranch}
                    </code>
                  </TooltipTrigger>
                  <TooltipContent>{targetBranch}</TooltipContent>
                </Tooltip>
              </div>
            </CardDescription>
          </div>
          <Badge
            variant={status === "opened" ? "default" : "secondary"}
            className="flex items-center gap-1.5"
          >
            {status === "opened" ? (
              <GitPullRequestIcon className="size-3" />
            ) : (
              <GitMergeIcon className="size-3" />
            )}
            {status === "opened" ? "Open" : "Merged"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="prose prose-sm dark:prose-invert prose-neutral max-w-none [&_ul]:list-disc [&_ul]:pl-4">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              img: ({ src, alt }) => (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border my-4">
                  <Image
                    src={src as string}
                    alt={alt || "PR preview"}
                    fill
                    className="object-cover"
                  />
                </div>
              ),
              p: ({ children }) => <p>{children}</p>,
            }}
          >
            {summary}
          </ReactMarkdown>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <FileIcon className="size-4" />
            <span>{stats.filesChanged} files</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#60EC93]">+{stats.additions}</span>
            <span className="text-destructive">-{stats.deletions}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <GitCommitIcon className="size-4" />
            <span>{stats.commits} commits</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageSquareIcon className="size-4" />
            <span>{stats.comments} comments</span>
          </div>
        </div>
      </CardContent>

      <Separator />

      <CardFooter className="py-4">
        <div className="flex items-center gap-2 w-full">
          <Button variant="outline" size="icon" className="gap-1.5 size-8">
            <HeartIcon className="size-4" />
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <ShareIcon className="size-4" />
            Share
          </Button>
          <div className="flex-1" />
          <Button variant="default" size="sm" className="gap-1.5" asChild>
            <a href={prUrl} target="_blank" rel="noopener noreferrer">
              View PR
              <ExternalLinkIcon className="size-4" />
            </a>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

const meta = {
  title: "Components/PRCard",
  component: PRCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof PRCard>;

export default meta;
type Story = StoryObj<typeof PRCard>;

export const OpenPR: Story = {
  args: {
    title: "feat: Add new authentication flow with OAuth2",
    author: {
      name: "Sarah Chen",
      avatar: "https://github.com/sarah.png",
    },
    sourceBranch: "feature/auth-flow",
    targetBranch: "main",
    status: "opened",
    summary:
      "This PR implements a new authentication flow using OAuth2 with support for multiple providers. The changes include new API endpoints, updated frontend components, and comprehensive test coverage.",
    stats: {
      filesChanged: 12,
      additions: 458,
      deletions: 32,
      commits: 5,
      comments: 3,
    },
    prUrl: "https://github.com/org/repo/pull/123",
  },
};

export const MergedPR: Story = {
  args: {
    title: "fix: Resolve race condition in data fetching",
    author: {
      name: "Alex Kim",
      avatar: "https://github.com/alex.png",
    },
    sourceBranch: "fix/data-race",
    targetBranch: "main",
    status: "merged",
    summary:
      "Fixed a critical race condition in the data fetching layer that was causing intermittent failures. Added proper request cancellation and implemented a request queue system.",
    stats: {
      filesChanged: 3,
      additions: 45,
      deletions: 12,
      commits: 2,
      comments: 5,
    },
    prUrl: "https://github.com/org/repo/pull/124",
  },
};

export const PRWithMarkdownAndImage: Story = {
  args: {
    title: "feat: Redesign dashboard layout with new data visualization",
    author: {
      name: "Emma Wilson",
      avatar: "https://github.com/emma.png",
    },
    sourceBranch:
      "feature/dashboard-redesign-with-new-data-visualization-components",
    targetBranch: "main",
    status: "opened",
    summary: `Complete overhaul of the dashboard layout with new data visualization components:

![New dashboard layout preview](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/og.jpg)

Key improvements include:
- Interactive charts with real-time updates
- Responsive grid system for better mobile experience
- Dark mode support with automatic theme switching
- Improved data readability with new typography scale

The new design focuses on improving the overall user experience while maintaining performance.`,
    stats: {
      filesChanged: 8,
      additions: 342,
      deletions: 156,
      commits: 4,
      comments: 7,
    },
    prUrl: "https://github.com/org/repo/pull/125",
  },
};
