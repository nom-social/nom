import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import IssueCard, { IssueCardProps } from "@/components/issue-card";

const meta: Meta<typeof IssueCard> = {
  title: "Components/IssueCard",
  component: IssueCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof IssueCard>;

const mockContributors = [
  { name: "Alex Kim", avatar: "https://github.com/alex.png" },
  { name: "Sarah Chen", avatar: "https://github.com/sarah.png" },
];

const mockProps: IssueCardProps = {
  title: "Bug: Unexpected error from `read_file` tool when clicking the button",
  contributors: mockContributors,
  body: "When clicking the **Submit** button, an error appears in the console. Steps to reproduce: 1. Go to the page. 2. Click Submit. 3. See error.",
  issueUrl: "https://github.com/org/repo/issues/123",
  repo: "repo",
  org: "org",
  state: "open",
  createdAt: new Date("2025-01-01"),
};

export const Default: Story = {
  render: () => <IssueCard {...mockProps} />,
};
