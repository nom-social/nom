import { Octokit } from "@octokit/rest";
import { Json } from "@/types/supabase";

/** Webhook event types supported via dedicated API endpoints */
export const FILTERABLE_EVENT_TYPES = [
  "push",
  "pull_request",
  "release",
] as const;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Rate limit delay when using unauthenticated requests (60 req/hr) */
const RATE_LIMIT_DELAY_MS = 2500;

async function maybeRateLimit(): Promise<void> {
  if (!process.env.GITHUB_TOKEN) {
    await delay(RATE_LIMIT_DELAY_MS);
  }
}

export interface EnrichedEventForInsert {
  event_type: string;
  action: string | null;
  org: string;
  repo: string;
  raw_payload: Json;
  created_at: string;
}

const repoInfo = (org: string, repo: string, repoId = 0) => ({
  id: repoId,
  name: repo,
  full_name: `${org}/${repo}`,
  owner: { login: org, id: 0 },
  default_branch: "main",
});

/**
 * Fetches events from dedicated GitHub API endpoints (commits, pulls, releases)
 * and returns webhook-style payloads ready for insert.
 * Avoids the Events API which mixes in stars/comments making useful events hard to find.
 *
 * @param types - Which event types to fetch (required)
 */
export async function fetchAndEnrichRepoEvents(
  octokit: Octokit,
  org: string,
  repo: string,
  limit: number,
  types: readonly string[]
): Promise<EnrichedEventForInsert[]> {
  if (!types.length) {
    throw new Error(
      "--types is required (e.g. --types push,pull_request,release)"
    );
  }

  const typeSet = new Set(types.map((t) => t.toLowerCase()));
  const results: EnrichedEventForInsert[] = [];

  const { data: repoData } = await octokit.repos.get({ owner: org, repo });
  await maybeRateLimit();
  const defaultBranch = repoData.default_branch ?? "main";

  const baseRepoInfo = {
    ...repoInfo(org, repo, repoData.id),
    default_branch: defaultBranch,
  };

  if (typeSet.has("push")) {
    const { data: commits } = await octokit.repos.listCommits({
      owner: org,
      repo,
      sha: defaultBranch,
      per_page: Math.min(limit, 100),
    });
    await maybeRateLimit();

    for (const c of commits ?? []) {
      const author = c.commit?.author;
      const timestamp = author?.date ?? new Date().toISOString();
      const commitPayload = {
        ref: `refs/heads/${defaultBranch}`,
        before: c.parents?.[0]?.sha ?? "",
        after: c.sha ?? "",
        commits: [
          {
            id: c.sha,
            message: c.commit?.message ?? "",
            timestamp,
            url:
              c.html_url ?? `https://github.com/${org}/${repo}/commit/${c.sha}`,
            author: {
              name: author?.name ?? "unknown",
              email: author?.email ?? "",
              username: c.author?.login,
            },
          },
        ],
        head_commit: {
          id: c.sha,
          message: c.commit?.message ?? "",
          timestamp,
          url:
            c.html_url ?? `https://github.com/${org}/${repo}/commit/${c.sha}`,
          author: {
            name: author?.name ?? "unknown",
            email: author?.email ?? "",
            username: c.author?.login,
          },
        },
        pusher: {
          name: c.author?.login ?? c.commit?.author?.name ?? "unknown",
          email: "",
          username: c.author?.login,
        },
        repository: baseRepoInfo,
      };
      results.push({
        event_type: "push",
        action: null,
        org,
        repo,
        raw_payload: commitPayload as Json,
        created_at: timestamp,
      });
    }
  }

  if (typeSet.has("pull_request")) {
    const { data: pulls } = await octokit.pulls.list({
      owner: org,
      repo,
      state: "closed",
      sort: "updated",
      direction: "desc",
      per_page: Math.min(limit, 100),
    });
    await maybeRateLimit();

    const mergedCandidates = (pulls ?? []).filter(
      (p) => (p as { merged_at?: string | null }).merged_at
    );
    for (const prSummary of mergedCandidates) {
      const { data: pr } = await octokit.pulls.get({
        owner: org,
        repo,
        pull_number: prSummary.number,
      });
      await maybeRateLimit();

      if (!pr.merged) continue;

      const updatedAt =
        pr.updated_at ??
        pr.merged_at ??
        pr.created_at ??
        new Date().toISOString();
      const rawPayload = {
        action: "closed",
        pull_request: {
          number: pr.number,
          title: pr.title,
          body: pr.body,
          html_url: pr.html_url ?? "",
          created_at: pr.created_at,
          updated_at: updatedAt,
          merged: pr.merged ?? true,
          draft: pr.draft,
          requested_reviewers: pr.requested_reviewers?.map((r) => ({
            login: r.login,
          })),
          assignees: pr.assignees?.map((a) => ({ login: a.login })),
          user: pr.user ? { login: pr.user.login } : { login: "" },
          author_association: pr.author_association ?? "NONE",
          head: { ref: pr.head.ref, sha: pr.head.sha },
          base: { ref: pr.base.ref },
          comments: pr.comments ?? 0,
          additions: pr.additions ?? 0,
          deletions: pr.deletions ?? 0,
          changed_files: pr.changed_files ?? 0,
          review_comments: pr.review_comments ?? 0,
          labels:
            pr.labels?.map((l) => ({
              name:
                typeof l === "object"
                  ? ((l as { name?: string }).name ?? "")
                  : String(l),
            })) ?? [],
        },
        repository: baseRepoInfo,
      };
      results.push({
        event_type: "pull_request",
        action: "closed",
        org,
        repo,
        raw_payload: rawPayload as Json,
        created_at: updatedAt,
      });
    }
  }

  if (typeSet.has("release")) {
    const { data: releases } = await octokit.repos.listReleases({
      owner: org,
      repo,
      per_page: Math.min(limit, 100),
    });
    await maybeRateLimit();

    for (const r of releases ?? []) {
      const publishedAt = r.published_at ?? r.created_at;
      const rawPayload = {
        action: r.published_at ? "published" : "edited",
        release: {
          id: r.id,
          tag_name: r.tag_name,
          name: r.name,
          body: r.body,
          html_url: r.html_url ?? "",
          created_at: r.created_at,
          published_at: r.published_at,
          author: r.author ? { login: r.author.login } : { login: "" },
          assets:
            r.assets?.map((a) => ({
              name: a.name,
              size: a.size ?? 0,
              download_count: a.download_count ?? 0,
              content_type: a.content_type ?? "",
              browser_download_url: a.browser_download_url ?? "",
            })) ?? [],
        },
        repository: baseRepoInfo,
      };
      results.push({
        event_type: "release",
        action: r.published_at ? "published" : "edited",
        org,
        repo,
        raw_payload: rawPayload as Json,
        created_at: publishedAt ?? r.created_at,
      });
    }
  }

  results.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return results.slice(0, limit);
}
