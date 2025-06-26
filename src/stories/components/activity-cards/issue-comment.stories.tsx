import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import IssueCard from "@/components/issue-card";

const meta: Meta<typeof IssueCard> = {
  title: "Components/ActivityCards/IssueComment",
  component: IssueCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    body: { control: "text" },
    contributors: { control: "object" },
    issueUrl: { control: "text" },
    repo: { control: "text" },
    org: { control: "text" },
    state: {
      control: "select",
      options: ["open", "closed"],
    },
    createdAt: { control: "date" },
    title: { control: "text" },
  },
};
export default meta;

type Story = StoryObj<typeof IssueCard>;

export const Default: Story = {
  render: (args) => {
    const [liked, setLiked] = React.useState(false);
    const [likeCount, setLikeCount] = React.useState(0);
    return (
      <div className="max-w-2xl w-full">
        <IssueCard
          {...args}
          liked={liked}
          likeCount={likeCount}
          onLike={() => {
            setLiked(true);
            setLikeCount((c) => c + 1);
          }}
          onUnlike={() => {
            setLiked(false);
            setLikeCount((c) => Math.max(0, c - 1));
          }}
        />
      </div>
    );
  },
  args: {
    title: "Fix: Unexpected behavior in user login flow",
    body: "> This is a critical issue for our users.\n\nI encountered this issue as well. The login button doesn't respond after entering credentials. Any updates?",
    contributors: [
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
