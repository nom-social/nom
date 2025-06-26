import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import ReleaseCard from "@/components/release-card";

const meta = {
  title: "Components/ReleaseCard",
  component: ReleaseCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ReleaseCard>;

export default meta;
type Story = StoryObj<typeof ReleaseCard>;

export const Default: Story = {
  args: {
    title: "v2.0.0: Major Release 🚀",
    contributors: [
      { name: "Jane Doe", avatar: "https://github.com/janedoe.png" },
    ],
    body: "This release introduces dark mode, improves performance, and fixes minor bugs. No breaking changes. Thanks to all contributors!",
    releaseUrl: "https://github.com/org/repo/releases/tag/v2.0.0",
    repo: "repo",
    org: "org",
    tagName: "v2.0.0",
    publishedAt: new Date("2025-02-01"),
  },
};
