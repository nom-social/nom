import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import IssueCard from "@/components/shared/activity-cards/issue-card";
import PRCard from "@/components/shared/activity-cards/pr-card";
import ReleaseCard from "@/components/shared/activity-cards/release-card";

const meta: Meta = {
  title: "Components/ActivityCards/Feed",
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj;

export const CombinedFeed: Story = {
  render: () => {
    // Example data from the other stories
    const issueArgs = {
      title:
        "Bug: Unexpected error from `read_file` tool when clicking the button",
      contributors: [
        { name: "Alex Kim", avatar: "https://github.com/alex.png" },
        { name: "Sarah Chen", avatar: "https://github.com/sarah.png" },
      ],
      body: "When clicking the **Submit** button, an error appears in the console. Steps to reproduce:\n\n1. Go to the page.\n2. Click Submit.\n3. See error.",
      issueUrl: "https://github.com/org/repo/issues/123",
      repo: "repo",
      org: "org",
      state: "open" as const,
      createdAt: new Date("2025-01-01"),
    };
    const prArgs = {
      title: "fix: Resolve race condition in data fetching",
      contributors: [
        { name: "Alex Kim", avatar: "https://github.com/alex.png" },
        { name: "Sarah Chen", avatar: "https://github.com/sarah.png" },
      ],
      body:
        "Fixed a critical race condition in the data fetching layer that was " +
        "causing intermittent failures. Added proper request cancellation and " +
        "implemented a request queue system.",
      prUrl: "https://github.com/org/repo/pull/124",
      repo: "repo",
      org: "org",
      state: "merged" as const,
      createdAt: new Date("2025-01-01"),
    };
    const issueCommentArgs = {
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
      state: "open" as const,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    };
    const releaseArgs = {
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
      aiSummary:
        "This release introduces project-scoped roles, MCP server enhancements, and a UI library blocks. It also includes compliance resources and community showcases.",
    };
    // Add more example data for additional cards
    const moreIssueArgs = {
      title: "Feature: Add dark mode toggle to settings page",
      contributors: [
        { name: "Emma Wilson", avatar: "https://github.com/emma.png" },
      ],
      body: "Users have requested a dark mode toggle in the settings page. This would improve accessibility and user experience, especially at night.",
      issueUrl: "https://github.com/org/repo/issues/456",
      repo: "repo",
      org: "org",
      state: "open" as const,
      createdAt: new Date("2025-01-05"),
    };
    const morePRArgs = {
      title: "chore: Refactor authentication logic for clarity",
      contributors: [
        { name: "Sarah Chen", avatar: "https://github.com/sarah.png" },
      ],
      body: "Refactored the authentication logic to use hooks and context for better maintainability. No breaking changes.",
      prUrl: "https://github.com/org/repo/pull/457",
      repo: "repo",
      org: "org",
      state: "open" as const,
      createdAt: new Date("2025-01-06"),
    };
    const moreIssueCommentArgs = {
      title: "Docs: Update README with new setup instructions",
      body: "Great update! The new setup instructions are much clearer. Thanks for making this change.",
      contributors: [
        { name: "Jane Doe", avatar: "https://github.com/janedoe.png" },
      ],
      issueUrl: "https://github.com/org/repo/issues/789",
      repo: "repo",
      org: "org",
      state: "closed" as const,
      createdAt: new Date("2025-01-07"),
    };
    const moreReleaseArgs = {
      title: "v2.1.0: Minor Improvements & Bugfixes",
      contributors: [
        { name: "Alex Kim", avatar: "https://github.com/alex.png" },
        { name: "Emma Wilson", avatar: "https://github.com/emma.png" },
      ],
      body: `- Improved onboarding flow\n- Fixed issue with notification dropdown\n- Updated dependencies for security\n- Minor UI tweaks`,
      releaseUrl: "https://github.com/org/repo/releases/tag/v2.1.0",
      repo: "repo",
      org: "org",
      tagName: "v2.1.0",
      publishedAt: new Date("2025-03-01"),
      aiSummary:
        "This release introduces project-scoped roles, MCP server enhancements, and a UI library blocks. It also includes compliance resources and community showcases.",
    };
    // Like state for each card (now 8 cards)
    const [liked, setLiked] = React.useState([
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
    const [likeCount, setLikeCount] = React.useState([0, 0, 0, 0, 0, 0, 0, 0]);
    return (
      <div className="max-w-2xl w-full space-y-4">
        <IssueCard
          {...issueArgs}
          liked={liked[0]}
          likeCount={likeCount[0]}
          onLike={() => {
            setLiked((arr) => [true, ...arr.slice(1)]);
            setLikeCount((arr) => [arr[0] + 1, ...arr.slice(1)]);
          }}
          onUnlike={() => {
            setLiked((arr) => [false, ...arr.slice(1)]);
            setLikeCount((arr) => [Math.max(0, arr[0] - 1), ...arr.slice(1)]);
          }}
        />
        <PRCard
          {...prArgs}
          liked={liked[1]}
          likeCount={likeCount[1]}
          onLike={() => {
            setLiked((arr) => [arr[0], true, ...arr.slice(2)]);
            setLikeCount((arr) => [arr[0], arr[1] + 1, ...arr.slice(2)]);
          }}
          onUnlike={() => {
            setLiked((arr) => [arr[0], false, ...arr.slice(2)]);
            setLikeCount((arr) => [
              arr[0],
              Math.max(0, arr[1] - 1),
              ...arr.slice(2),
            ]);
          }}
        />
        <IssueCard
          {...issueCommentArgs}
          liked={liked[2]}
          likeCount={likeCount[2]}
          onLike={() => {
            setLiked((arr) => [arr[0], arr[1], true, ...arr.slice(3)]);
            setLikeCount((arr) => [
              arr[0],
              arr[1],
              arr[2] + 1,
              ...arr.slice(3),
            ]);
          }}
          onUnlike={() => {
            setLiked((arr) => [arr[0], arr[1], false, ...arr.slice(3)]);
            setLikeCount((arr) => [
              arr[0],
              arr[1],
              Math.max(0, arr[2] - 1),
              ...arr.slice(3),
            ]);
          }}
        />
        <ReleaseCard
          {...releaseArgs}
          liked={liked[3]}
          likeCount={likeCount[3]}
          onLike={() => {
            setLiked((arr) => [arr[0], arr[1], arr[2], true, ...arr.slice(4)]);
            setLikeCount((arr) => [
              arr[0],
              arr[1],
              arr[2],
              arr[3] + 1,
              ...arr.slice(4),
            ]);
          }}
          onUnlike={() => {
            setLiked((arr) => [arr[0], arr[1], arr[2], false, ...arr.slice(4)]);
            setLikeCount((arr) => [
              arr[0],
              arr[1],
              arr[2],
              Math.max(0, arr[3] - 1),
              ...arr.slice(4),
            ]);
          }}
        />
        {/* Additional cards */}
        <IssueCard
          {...moreIssueArgs}
          liked={liked[4]}
          likeCount={likeCount[4]}
          onLike={() => {
            setLiked((arr) => [...arr.slice(0, 4), true, ...arr.slice(5)]);
            setLikeCount((arr) => [
              ...arr.slice(0, 4),
              arr[4] + 1,
              ...arr.slice(5),
            ]);
          }}
          onUnlike={() => {
            setLiked((arr) => [...arr.slice(0, 4), false, ...arr.slice(5)]);
            setLikeCount((arr) => [
              ...arr.slice(0, 4),
              Math.max(0, arr[4] - 1),
              ...arr.slice(5),
            ]);
          }}
        />
        <PRCard
          {...morePRArgs}
          liked={liked[5]}
          likeCount={likeCount[5]}
          onLike={() => {
            setLiked((arr) => [...arr.slice(0, 5), true, ...arr.slice(6)]);
            setLikeCount((arr) => [
              ...arr.slice(0, 5),
              arr[5] + 1,
              ...arr.slice(6),
            ]);
          }}
          onUnlike={() => {
            setLiked((arr) => [...arr.slice(0, 5), false, ...arr.slice(6)]);
            setLikeCount((arr) => [
              ...arr.slice(0, 5),
              Math.max(0, arr[5] - 1),
              ...arr.slice(6),
            ]);
          }}
        />
        <IssueCard
          {...moreIssueCommentArgs}
          liked={liked[6]}
          likeCount={likeCount[6]}
          onLike={() => {
            setLiked((arr) => [...arr.slice(0, 6), true, arr[7]]);
            setLikeCount((arr) => [...arr.slice(0, 6), arr[6] + 1, arr[7]]);
          }}
          onUnlike={() => {
            setLiked((arr) => [...arr.slice(0, 6), false, arr[7]]);
            setLikeCount((arr) => [
              ...arr.slice(0, 6),
              Math.max(0, arr[6] - 1),
              arr[7],
            ]);
          }}
        />
        <ReleaseCard
          {...moreReleaseArgs}
          liked={liked[7]}
          likeCount={likeCount[7]}
          onLike={() => {
            setLiked((arr) => [...arr.slice(0, 7), true]);
            setLikeCount((arr) => [...arr.slice(0, 7), arr[7] + 1]);
          }}
          onUnlike={() => {
            setLiked((arr) => [...arr.slice(0, 7), false]);
            setLikeCount((arr) => [
              ...arr.slice(0, 7),
              Math.max(0, arr[7] - 1),
            ]);
          }}
        />
      </div>
    );
  },
};
