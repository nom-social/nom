import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import RepoProfileCard from "@/components/[org]/[repo]/repo-profile-card";

const meta = {
  title: "Components/[org]/[repo]/RepoProfileCard",
  component: RepoProfileCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    org: { control: "text" },
    repo: { control: "text" },
    createdAt: { control: "date" },
    description: { control: "text" },
    websiteUrl: { control: "text" },
    avatarUrl: { control: "text" },
    topLanguages: { control: "object" },
    license: { control: "text" },
  },
} satisfies Meta<typeof RepoProfileCard>;

export default meta;
type Story = StoryObj<typeof RepoProfileCard>;

export const Default: Story = {
  render: (args) => {
    return (
      <div className="w-2xl">
        <RepoProfileCard {...args} />
      </div>
    );
  },
  args: {
    org: "shadcn-ui",
    repo: "ui",
    createdAt: new Date("2025-06-27"),
    description:
      "A set of beautifully-designed, accessible components and a code distribution platform. " +
      "Works with your favorite frameworks. Open Source. Open Code.",
    websiteUrl: "https://ui.shadcn.com/",
    avatarUrl: "https://github.com/shadcn.png",
    topLanguages: [
      { name: "TypeScript", color: "#2b7489" },
      { name: "JavaScript", color: "#f1e05a" },
      { name: "CSS", color: "#563d7c" },
    ],
    license: "MIT",
    initialSubscriptionCount: 1_200,
  },
};
