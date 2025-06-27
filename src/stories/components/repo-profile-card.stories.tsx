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
    org: "org",
    repo: "repo",
  },
};
