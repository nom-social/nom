import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShareIcon, ExternalLinkIcon, HeartIcon } from "lucide-react";
import { AvatarGroup, Contributor } from "@/components/ui/avatar-group";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/ui/Markdown";

interface ActivityCardProps {
  title: string;
  contributors: Contributor[];
  status: "opened" | "merged";
  body: string;
  prUrl: string;
  repo: string;
  org: string;
}

const ActivityCard = ({
  title,
  contributors,
  status,
  body,
  prUrl,
  repo,
  org,
}: ActivityCardProps) => {
  return (
    <Card className="w-full max-w-2xl bg-card rounded-lg border border-border shadow-sm relative hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-3 w-full justify-between">
            <h3 className="text-base font-semibold text-card-foreground line-clamp-2 leading-tight">
              {title}
            </h3>
            <Badge className="px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium bg-[#746AFF] text-black">
              PR • {status === "merged" ? "Merged" : "Open"}
            </Badge>
          </div>
          <div className="text-muted-foreground text-sm">
            {org}/{repo}
          </div>
          <div className="flex items-center">
            <AvatarGroup contributors={contributors} />
          </div>
        </div>
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
    status: "opened",
    body: "This PR implements a new authentication flow using OAuth2 with support for multiple providers. The changes include new API endpoints, updated frontend components, and comprehensive test coverage.",
    prUrl: "https://github.com/org/repo/pull/123",
    repo: "nom",
    org: "nom-social",
  },
};

export const MergedPR: Story = {
  args: {
    title: "fix: Resolve race condition in data fetching",
    contributors: [
      { name: "Alex Kim", avatar: "https://github.com/alex.png" },
      { name: "Sarah Chen", avatar: "https://github.com/sarah.png" },
    ],
    status: "merged",
    body: "Fixed a critical race condition in the data fetching layer that was causing intermittent failures. Added proper request cancellation and implemented a request queue system.",
    prUrl: "https://github.com/org/repo/pull/124",
    repo: "nom",
    org: "nom-social",
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
    status: "opened",
    body: `Complete overhaul of the dashboard layout with new data visualization components:\n\n![New dashboard layout preview](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/og.jpg)\n\nKey improvements include:\n- Interactive charts with real-time updates\n- Responsive grid system for better mobile experience\n- Dark mode support with automatic theme switching\n- Improved data readability with new typography scale\n\nThe new design focuses on improving the overall user experience while maintaining performance.`,
    prUrl: "https://github.com/org/repo/pull/125",
    repo: "nom",
    org: "nom-social",
  },
};
