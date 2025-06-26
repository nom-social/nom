import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import IssueCommentCard from "@/components/issue-comment-card";

const meta: Meta<typeof IssueCommentCard> = {
  title: "Components/IssueCommentCard",
  component: IssueCommentCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    issueTitle: { control: "text" },
    commentBody: { control: "text" },
    commenter: { control: "object" },
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

type Story = StoryObj<typeof IssueCommentCard>;

export const Default: Story = {
  args: {
    issueTitle: "Fix: Unexpected behavior in user login flow",
    commentBody:
      "> This is a critical issue for our users.\n\nI encountered this issue as well. The login button doesn't respond after entering credentials. Any updates?",
    commenter: [
      {
        name: "The Octocat",
        avatar: "https://github.com/octocat.png",
      },
    ],
    issueUrl: "https://github.com/org/repo/issues/123",
    repo: "repo",
    org: "org",
    state: "open",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
};
