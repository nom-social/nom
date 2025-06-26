import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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

interface ActivityCardProps {
  title: string;
  contributors: Contributor[];
  status: "opened" | "merged";
  body: string;
  prUrl: string;
  repo: string;
  org: string;
  state?: "open" | "closed";
  type: "pr" | "issue" | "release";
}

const ActivityCard = ({
  title,
  contributors,
  body,
  prUrl,
  repo,
  org,
  state,
  type,
}: ActivityCardProps) => {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction>
          <Badge className="bg-[#746AFF] hover:bg-[#746AFF]/90 border-transparent uppercase text-black">
            {type} • {state}
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
        <div className="prose prose-sm dark:prose-invert prose-neutral max-w-none [&_ul]:list-disc [&_ul]:pl-4">
          <Markdown>{body}</Markdown>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full">
          <div className="flex items-center gap-1 flex-wrap">
            <Button variant="outline" size="icon" className="gap-1.5 size-8">
              <HeartIcon className="size-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ShareIcon className="size-4" />
              Share
            </Button>
            <Button variant="default" size="sm" className="gap-1.5" asChild>
              <a href={prUrl} target="_blank" rel="noopener noreferrer">
                View PR
                <ExternalLinkIcon className="size-4" />
              </a>
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

const meta = {
  title: "Components/ActivityCard",
  component: ActivityCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ActivityCard>;

export default meta;
type Story = StoryObj<typeof ActivityCard>;

export const OpenPR: Story = {
  args: {
    title: "feat: Add new authentication flow with OAuth2",
    contributors: [
      { name: "Sarah Chen", avatar: "https://github.com/sarah.png" },
      { name: "Alex Kim", avatar: "https://github.com/alex.png" },
    ],
    body: "This PR implements a new authentication flow using OAuth2 with support for multiple providers. The changes include new API endpoints, updated frontend components, and comprehensive test coverage.",
    prUrl: "https://github.com/org/repo/pull/123",
    repo: "nom",
    org: "nom-social",
    state: "closed",
    type: "pr",
  },
};

export const MergedPR: Story = {
  args: {
    title: "fix: Resolve race condition in data fetching",
    contributors: [
      { name: "Alex Kim", avatar: "https://github.com/alex.png" },
      { name: "Sarah Chen", avatar: "https://github.com/sarah.png" },
    ],
    body: "Fixed a critical race condition in the data fetching layer that was causing intermittent failures. Added proper request cancellation and implemented a request queue system.",
    prUrl: "https://github.com/org/repo/pull/124",
    repo: "nom",
    org: "nom-social",
    state: "closed",
    type: "pr",
  },
};

export const PRWithMarkdownAndImage: Story = {
  args: {
    title:
      "feat: Redesign dashboard layout with new data visualization\nAdd support for real-time updates and mobile responsiveness",
    contributors: [
      { name: "Emma Wilson", avatar: "https://github.com/emma.png" },
      { name: "Alex Kim", avatar: "https://github.com/alex.png" },
      { name: "Sarah Chen", avatar: "https://github.com/sarah.png" },
    ],
    body: `Complete overhaul of the dashboard layout with new data visualization components:\n\n![New dashboard layout preview](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/og.jpg)\n\nKey improvements include:\n- Interactive charts with real-time updates\n- Responsive grid system for better mobile experience\n- Dark mode support with automatic theme switching\n- Improved data readability with new typography scale\n\nThe new design focuses on improving the overall user experience while maintaining performance.`,
    prUrl: "https://github.com/org/repo/pull/125",
    repo: "nom",
    org: "nom-social",
    state: "closed",
    type: "pr",
  },
};
