"use client";

import PRCard from "@/components/activity-cards/pr-card";
import IssueCard from "@/components/activity-cards/issue-card";
import ReleaseCard from "@/components/activity-cards/release-card";
import { Tables } from "@/types/supabase";
import { issueDataSchema } from "@/components/activity-cards/shared/schemas";
import { prDataSchema } from "@/components/activity-cards/shared/schemas";
import { releaseDataSchema } from "@/components/activity-cards/shared/schemas";

export default function ActivityCard({
  item,
  repo,
  org,
}: {
  item: Tables<"public_timeline"> | Tables<"user_timeline">;
  repo: string;
  org: string;
}) {
  if (item.type === "pull_request") {
    const parseResult = prDataSchema.safeParse(item.data);
    if (!parseResult.success) {
      return null;
    }

    return (
      <PRCard
        key={item.id}
        title={parseResult.data.pull_request.title}
        contributors={parseResult.data.pull_request.contributors.map(
          (login) => ({
            name: login,
            avatar: `https://github.com/${login}.png`,
          })
        )}
        body={parseResult.data.pull_request.ai_summary}
        prUrl={parseResult.data.pull_request.html_url}
        repo={repo}
        org={org}
        state={parseResult.data.pull_request.merged ? "merged" : "open"}
        createdAt={new Date(parseResult.data.pull_request.created_at)}
        likeCount={0}
        liked={false}
      />
    );
  }
  if (item.type === "issue") {
    const parseResult = issueDataSchema.safeParse(item.data);
    if (!parseResult.success) {
      return null;
    }

    return (
      <IssueCard
        key={item.id}
        title={parseResult.data.issue.title}
        contributors={parseResult.data.issue.contributors.map((login) => ({
          name: login,
          avatar: `https://github.com/${login}.png`,
        }))}
        body={parseResult.data.issue.ai_summary}
        issueUrl={parseResult.data.issue.html_url}
        repo={repo}
        org={org}
        state={parseResult.data.issue.state}
        createdAt={new Date(parseResult.data.issue.created_at)}
        likeCount={0}
        liked={false}
      />
    );
  }
  if (item.type === "release") {
    const parseResult = releaseDataSchema.safeParse(item.data);
    if (!parseResult.success) {
      return null;
    }
    const release = parseResult.data.release;

    return (
      <ReleaseCard
        key={item.id}
        title={release.name || release.tag_name}
        contributors={parseResult.data.release.contributors.map((login) => ({
          name: login,
          avatar: `https://github.com/${login}.png`,
        }))}
        releaseUrl={release.html_url}
        repo={repo}
        org={org}
        tagName={release.tag_name}
        publishedAt={
          release.published_at
            ? new Date(release.published_at)
            : new Date(release.created_at)
        }
        body={release.ai_summary}
        likeCount={0}
        liked={false}
      />
    );
  }

  return null;
}
