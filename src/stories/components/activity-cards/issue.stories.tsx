import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import IssueCard from "@/components/issue-card";

const meta: Meta<typeof IssueCard> = {
  title: "Components/ActivityCards/Issue",
  component: IssueCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    title: { control: "text" },
    contributors: { control: "object" },
    body: { control: "text" },
    issueUrl: { control: "text" },
    repo: { control: "text" },
    org: { control: "text" },
    state: {
      control: "select",
      options: ["open", "closed"],
    },
    createdAt: { control: "date" },
  },
};
export default meta;

type Story = StoryObj<typeof IssueCard>;

const mockContributors = [
  { name: "Alex Kim", avatar: "https://github.com/alex.png" },
  { name: "Sarah Chen", avatar: "https://github.com/sarah.png" },
];

export const Default: Story = {
  args: {
    title:
      "Bug: Unexpected error from `read_file` tool when clicking the button",
    contributors: mockContributors,
    body: "When clicking the **Submit** button, an error appears in the console. Steps to reproduce:\n\n1. Go to the page.\n2. Click Submit.\n3. See error.",
    issueUrl: "https://github.com/org/repo/issues/123",
    repo: "repo",
    org: "org",
    state: "open",
    createdAt: new Date("2025-01-01"),
  },
  render: (args) => (
    <div className="max-w-2xl w-full">
      <IssueCard {...args} />
    </div>
  ),
};
