import { timelineItemDataSchema } from "@/components/shared/activity-card/shared/schemas";

export interface RawTimelineItem {
  id: string;
  type: string;
  data?: unknown;
  updated_at: string;
  org?: string;
  repo?: string;
  repositories?: { org?: string; repo?: string };
}

export function normalizeTimelineItem(item: RawTimelineItem) {
  const org = item.org ?? item.repositories?.org ?? "";
  const repo = item.repo ?? item.repositories?.repo ?? "";
  const type = item.type ?? "";
  const rawData = item.data ?? {};

  let title = "";
  let url = "";
  let author = "";
  let summary = "";
  let contributors: string[] = [];

  try {
    const data = timelineItemDataSchema.parse({ ...rawData, type });
    switch (data.type) {
      case "pull_request": {
        const pr = data.pull_request;
        title = pr.title ?? "";
        url = pr.html_url ?? "";
        author = pr.user?.login ?? "";
        summary = pr.ai_summary ?? "";
        contributors = pr.contributors ?? [];
        break;
      }
      case "issue": {
        const issue = data.issue;
        title = issue.title ?? "";
        url = issue.html_url ?? "";
        author = issue.user?.login ?? "";
        summary = issue.ai_summary ?? "";
        contributors = issue.contributors ?? [];
        break;
      }
      case "release": {
        const release = data.release;
        title = release.name ?? release.tag_name ?? "";
        url = release.html_url ?? "";
        author = release.author?.login ?? "";
        summary = release.ai_summary ?? "";
        contributors = release.contributors ?? [];
        break;
      }
      case "push": {
        const push = data.push;
        title = push.title ?? "";
        url = push.html_url ?? "";
        author = push.contributors?.[0] ?? "";
        summary = push.ai_summary ?? "";
        contributors = push.contributors ?? [];
        break;
      }
    }
  } catch {
    // invalid or empty data - use default empty values
  }

  return {
    id: item.id,
    type,
    org,
    repo,
    title,
    summary,
    url,
    author,
    contributors,
    updated_at: item.updated_at,
  };
}
