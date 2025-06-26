import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ActivityCard from "@/components/ui/activity-card";
import { GitMergeIcon } from "lucide-react";

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

export const MergedPR: Story = {
  args: {
    title: "fix: Resolve race condition in data fetching",
    contributors: [
      { name: "Alex Kim", avatar: "https://github.com/alex.png" },
      { name: "Sarah Chen", avatar: "https://github.com/sarah.png" },
    ],
    body:
      "Fixed a critical race condition in the data fetching layer that was " +
      "causing intermittent failures. Added proper request cancellation and " +
      "implemented a request queue system.",
    prUrl: "https://github.com/org/repo/pull/124",
    repo: "nom",
    org: "nom-social",
    status: {
      state: "merged",
      type: "pr",
      icon: <GitMergeIcon />,
    },
  },
};

export const PRWithMarkdownAndImage: Story = {
  args: {
    title:
      "feat: Redesign dashboard layout with new data visualization\nAdd " +
      "support for real-time updates and mobile responsiveness",
    contributors: [
      { name: "Emma Wilson", avatar: "https://github.com/emma.png" },
      { name: "Alex Kim", avatar: "https://github.com/alex.png" },
      { name: "Sarah Chen", avatar: "https://github.com/sarah.png" },
    ],
    body: `Complete overhaul of the dashboard layout with new data visualization components:\n\n![New dashboard layout preview](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/og.jpg)\n\nKey improvements include:\n- Interactive charts with real-time updates\n- Responsive grid system for better mobile experience\n- Dark mode support with automatic theme switching\n- Improved data readability with new typography scale\n\nThe new design focuses on improving the overall user experience while maintaining performance.`,
    prUrl: "https://github.com/org/repo/pull/125",
    repo: "nom",
    org: "nom-social",
    status: {
      state: "merged",
      type: "pr",
      icon: <GitMergeIcon />,
    },
  },
};
