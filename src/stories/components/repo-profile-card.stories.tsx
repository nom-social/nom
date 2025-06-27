import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import RepoProfileCard from "@/components/repo-profile-card";

const meta = {
  title: "Components/RepoProfileCard",
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
      "The fastest way to build modern web applications with zero configuration. " +
      "Features hot reload, TypeScript support, and one-command deployment.",
    websiteUrl: "https://ui.shadcn.com/",
    avatarUrl: "https://github.com/shadcn.png",
  },
};
