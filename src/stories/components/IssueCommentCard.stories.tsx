import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import IssueCommentCard from "@/components/issue-comment-card";

const meta: Meta<typeof IssueCommentCard> = {
  title: "Components/IssueCommentCard",
  component: IssueCommentCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof IssueCommentCard>;

const props: React.ComponentProps<typeof IssueCommentCard> = {
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
};

export const Default: Story = {
  render: () => <IssueCommentCard {...props} />,
};
