import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import ReleaseCard from "./components/release-card";

const meta = {
  title: "Components/ActivityCards/Release",
  component: ReleaseCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    title: { control: "text" },
    contributors: { control: "object" },
    body: { control: "text" },
    releaseUrl: { control: "text" },
    repo: { control: "text" },
    org: { control: "text" },
    tagName: { control: "text" },
    publishedAt: { control: "date" },
  },
} satisfies Meta<typeof ReleaseCard>;

export default meta;
type Story = StoryObj<typeof ReleaseCard>;

export const Default: Story = {
  render: (args) => {
    const [liked, setLiked] = React.useState(false);
    const [likeCount, setLikeCount] = React.useState(0);
    return (
      <div className="max-w-2xl w-full">
        <ReleaseCard
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
    title: "v2.0.0: Major Release 🚀",
    contributors: [
      { name: "Jane Doe", avatar: "https://github.com/janedoe.png" },
    ],
    body: `- Project-Scoped Roles: Assign permissions per project for tighter security and clearer access control.\n- MCP Server Enhancements: Develop in VS Code and deploy EdgeFunctions directly from the MCP server.\n- UI Library Blocks: Drop-in Infinite Query for smooth infinite scrolling and Social Auth for ready-made login screens.\n- Compliance Resources: New SOC 2 report and security documentation for audit and trustworthiness.\n- Community Showcases: Dozens of tutorials and sample apps (React, Vue, n8n, WordPress, etc.) to jump-start your integrations.`,
    releaseUrl: "https://github.com/org/repo/releases/tag/v2.0.0",
    repo: "repo",
    org: "org",
    tagName: "v2.0.0",
    publishedAt: new Date("2025-02-01"),
  },
};
