import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import PRCard from "@/components/pr-card";

const meta = {
  title: "Components/ActivityCards/PR",
  component: PRCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    title: { control: "text" },
    contributors: { control: "object" },
    body: { control: "text" },
    prUrl: { control: "text" },
    repo: { control: "text" },
    org: { control: "text" },
    state: {
      control: "select",
      options: ["open", "closed", "merged"],
    },
    createdAt: { control: "date" },
  },
} satisfies Meta<typeof PRCard>;

export default meta;
type Story = StoryObj<typeof PRCard>;

export const Default: Story = {
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
    repo: "repo",
    org: "org",
    state: "merged",
    createdAt: new Date("2025-01-01"),
  },
  render: (args) => (
    <div className="max-w-2xl w-full">
      <PRCard {...args} />
    </div>
  ),
};

export const WithMarkdownAndImage: Story = {
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
    repo: "repo",
    org: "org",
    state: "merged",
    createdAt: new Date("2025-01-01"),
  },
  render: (args) => (
    <div className="max-w-2xl w-full">
      <PRCard {...args} />
    </div>
  ),
};
