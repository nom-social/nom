import { Octokit } from "@octokit/rest";
import { Json } from "@/types/supabase";

/** Event from GitHub Events API (GET /repos/{owner}/{repo}/events) */
interface GithubEvent {
  id: string;
  type: string | null;
  actor: { login: string; id?: number };
  repo: { id: number; name: string; url: string };
  org?: { login: string };
  payload: Record<string, unknown>;
  public: boolean;
  created_at: string | null;
}

const EVENTS_API_TO_WEBHOOK: Record<string, string> = {
  PushEvent: "push",
  PullRequestEvent: "pull_request",
  IssuesEvent: "issues",
  IssueCommentEvent: "issue_comment",
  ReleaseEvent: "release",
};

const SUPPORTED_EVENT_TYPES = new Set(Object.keys(EVENTS_API_TO_WEBHOOK));

/** Webhook event types that can be filtered: push, pull_request, issues, issue_comment, release */
export const FILTERABLE_EVENT_TYPES = [
  "push",
  "pull_request",
  "issues",
  "issue_comment",
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

/**
 * Fetches the last N events from the Events API, enriches them into webhook
 * format, and returns events ready for github_event_log insertion.
 * @param types - Optional filter: only include these webhook event types (e.g. ["push", "pull_request", "release"])
 */
export async function fetchAndEnrichRepoEvents(
  octokit: Octokit,
  org: string,
  repo: string,
  limit: number = 20,
  types?: readonly string[]
): Promise<EnrichedEventForInsert[]> {
  const { data: events } = await octokit.activity.listRepoEvents({
    owner: org,
    repo,
    per_page: Math.min(limit * 5, 100),
  });

  const result: EnrichedEventForInsert[] = [];
  const typeFilter =
    types && types.length > 0
      ? new Set(types.map((t) => t.toLowerCase()))
      : null;

  for (const evt of (events ?? []) as GithubEvent[]) {
    if (result.length >= limit) break;
    if (!evt.type || !SUPPORTED_EVENT_TYPES.has(evt.type)) continue;

    const eventType = EVENTS_API_TO_WEBHOOK[evt.type]!;
    if (typeFilter && !typeFilter.has(eventType.toLowerCase())) continue;
    const createdAt = evt.created_at ?? new Date().toISOString();

    try {
      const rawPayload = await enrichPayload(octokit, org, repo, evt);
      if (!rawPayload) continue;

      result.push({
        event_type: eventType,
        action: (evt.payload?.action as string) ?? null,
        org,
        repo,
        raw_payload: rawPayload,
        created_at: createdAt,
      });
    } catch (err) {
      console.warn(`Skipping event ${evt.id} (${evt.type}):`, err);
    }
  }

  return result;
}

async function enrichPayload(
  octokit: Octokit,
  org: string,
  repo: string,
  evt: GithubEvent
): Promise<Json | null> {
  await maybeRateLimit();

  const payload = evt.payload;
  const actorLogin = evt.actor?.login ?? "unknown";
  const repoInfo = {
    id: evt.repo?.id ?? 0,
    name: repo,
    full_name: `${org}/${repo}`,
    owner: { login: org, id: 0 },
    default_branch: "main",
  };

  switch (evt.type) {
    case "PushEvent": {
      const ref = (payload.ref as string) ?? "";
      const before = (payload.before as string) ?? "";
      const head = (payload.head as string) ?? payload.after ?? "";
      const commits =
        (payload.commits as Array<{
          sha?: string;
          message?: string;
          author?: { name?: string; email?: string };
        }>) ?? [];

      const { data: repoData } = await octokit.repos.get({
        owner: org,
        repo,
      });
      await maybeRateLimit();

      const defaultBranch = repoData?.default_branch ?? "main";
      const pushedBranch = ref.replace("refs/heads/", "");
      if (pushedBranch !== defaultBranch) return null;

      const enrichedCommits: Array<{
        id: string;
        message: string;
        timestamp: string;
        url: string;
        author: { name: string; email: string; username?: string };
      }> = [];

      for (const c of commits) {
        const sha = c.sha;
        if (!sha) continue;
        try {
          const { data: commitData } = await octokit.repos.getCommit({
            owner: org,
            repo,
            ref: sha,
          });
          await maybeRateLimit();
          const author = commitData.commit?.author;
          enrichedCommits.push({
            id: commitData.sha,
            message: commitData.commit?.message ?? c.message ?? "",
            timestamp: author?.date ?? new Date().toISOString(),
            url:
              commitData.html_url ??
              `https://github.com/${org}/${repo}/commit/${sha}`,
            author: {
              name: author?.name ?? c.author?.name ?? "unknown",
              email: author?.email ?? c.author?.email ?? "",
              username: commitData.author?.login,
            },
          });
        } catch {
          enrichedCommits.push({
            id: sha,
            message: c.message ?? "",
            timestamp: new Date().toISOString(),
            url: `https://github.com/${org}/${repo}/commit/${sha}`,
            author: {
              name: c.author?.name ?? "unknown",
              email: c.author?.email ?? "",
              username: undefined,
            },
          });
        }
      }

      if (enrichedCommits.length === 0) return null;

      return {
        ref,
        before,
        after: head,
        commits: enrichedCommits,
        head_commit: enrichedCommits[enrichedCommits.length - 1],
        pusher: {
          name: actorLogin,
          email: "",
          username: actorLogin,
        },
        repository: {
          ...repoInfo,
          default_branch: defaultBranch,
        },
        organization: evt.org ? { login: evt.org.login, id: 0 } : undefined,
      } as Json;
    }

    case "PullRequestEvent": {
      const action = payload.action as string;
      const number =
        (payload.number as number) ??
        (payload.pull_request as { number?: number })?.number;
      if (!number || action !== "closed") return null;

      const { data: pr } = await octokit.pulls.get({
        owner: org,
        repo,
        pull_number: number,
      });
      await maybeRateLimit();

      if (!pr.merged) return null;

      return {
        action: "closed",
        pull_request: {
          number: pr.number,
          title: pr.title,
          body: pr.body,
          html_url: pr.html_url ?? "",
          created_at: pr.created_at,
          updated_at: pr.updated_at ?? pr.merged_at,
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
        repository: repoInfo,
        organization: evt.org ? { login: evt.org.login, id: 0 } : undefined,
      } as Json;
    }

    case "IssuesEvent": {
      const issuePayload = payload.issue as Record<string, unknown> | undefined;
      const number =
        (issuePayload?.number as number) ?? (payload.number as number);
      if (!number) return null;

      const { data: issue } = await octokit.issues.get({
        owner: org,
        repo,
        issue_number: number,
      });
      await maybeRateLimit();

      return {
        action: (payload.action as string) ?? "opened",
        issue: {
          number: issue.number,
          title: issue.title ?? "",
          body: issue.body,
          html_url: issue.html_url ?? "",
          created_at: issue.created_at,
          updated_at: issue.updated_at ?? issue.created_at,
          state: issue.state as "open" | "closed",
          user: issue.user ? { login: issue.user.login } : { login: "" },
          author_association: issue.author_association ?? "NONE",
          assignee: issue.assignee ? { login: issue.assignee.login } : null,
          assignees: issue.assignees?.map((a) => ({ login: a.login })) ?? [],
          labels:
            issue.labels?.map((l) => ({
              name:
                typeof l === "object"
                  ? ((l as { name?: string }).name ?? "")
                  : String(l),
            })) ?? [],
          comments: issue.comments ?? 0,
        },
        repository: repoInfo,
        organization: evt.org ? { login: evt.org.login, id: 0 } : undefined,
      } as Json;
    }

    case "IssueCommentEvent": {
      const issuePayload = payload.issue as Record<string, unknown> | undefined;
      const commentPayload = payload.comment as
        | Record<string, unknown>
        | undefined;
      const number =
        (issuePayload?.number as number) ?? (payload.number as number);
      if (!number) return null;

      const hasFullComment =
        commentPayload &&
        typeof commentPayload.id === "number" &&
        typeof commentPayload.body === "string" &&
        commentPayload.user;

      const needsFetch = !hasFullComment;
      const [issueRes, commentRes] = await Promise.all([
        octokit.issues.get({ owner: org, repo, issue_number: number }),
        needsFetch && commentPayload?.id
          ? octokit.issues.getComment({
              owner: org,
              repo,
              comment_id: commentPayload.id as number,
            })
          : null,
      ]);
      await maybeRateLimit();

      const issue = issueRes.data;
      let comment: {
        id: number;
        user: { login: string };
        body: string;
        html_url: string;
        created_at: string;
        updated_at: string;
        author_association: string;
      };

      if (hasFullComment && commentPayload) {
        const user = commentPayload.user as { login?: string };
        comment = {
          id: commentPayload.id as number,
          user: { login: (user?.login as string) ?? actorLogin },
          body: (commentPayload.body as string) ?? "",
          html_url: (commentPayload.html_url as string) ?? "",
          created_at:
            (commentPayload.created_at as string) ?? new Date().toISOString(),
          updated_at:
            (commentPayload.updated_at as string) ??
            (commentPayload.created_at as string) ??
            new Date().toISOString(),
          author_association:
            (commentPayload.author_association as string) ?? "NONE",
        };
      } else if (commentRes?.data) {
        const c = commentRes.data;
        comment = {
          id: c.id,
          user: c.user ? { login: c.user.login } : { login: actorLogin },
          body: c.body ?? "",
          html_url: c.html_url ?? "",
          created_at: c.created_at ?? "",
          updated_at: c.updated_at ?? c.created_at ?? "",
          author_association: c.author_association ?? "NONE",
        };
      } else {
        comment = {
          id: 0,
          user: { login: actorLogin },
          body: "",
          html_url: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          author_association: "NONE",
        };
      }

      return {
        action: "created",
        issue: {
          number: issue.number,
          title: issue.title ?? "",
          user: issue.user ? { login: issue.user.login } : { login: "" },
          state: issue.state as "open" | "closed",
          html_url: issue.html_url ?? "",
          body: issue.body,
          created_at: issue.created_at,
          assignees: issue.assignees?.map((a) => ({ login: a.login })) ?? [],
          author_association: issue.author_association ?? "NONE",
        },
        comment,
        sender: { type: "User" as const },
        repository: repoInfo,
        organization: evt.org ? { login: evt.org.login, id: 0 } : undefined,
      } as Json;
    }

    case "ReleaseEvent": {
      const action = (payload.action as string) ?? "published";
      if (action !== "published" && action !== "edited") return null;

      const releasePayload = payload.release as
        | Record<string, unknown>
        | undefined;
      const tagName =
        (releasePayload?.tag_name as string) ?? (releasePayload?.tag as string);
      if (!tagName) return null;

      try {
        const { data: release } = await octokit.repos.getReleaseByTag({
          owner: org,
          repo,
          tag: tagName,
        });
        await maybeRateLimit();

        return {
          action,
          release: {
            id: release.id,
            tag_name: release.tag_name,
            name: release.name,
            body: release.body,
            html_url: release.html_url ?? "",
            created_at: release.created_at,
            published_at: release.published_at,
            author: release.author
              ? { login: release.author.login }
              : { login: "" },
            assets:
              release.assets?.map((a) => ({
                name: a.name,
                size: a.size ?? 0,
                download_count: a.download_count ?? 0,
                content_type: a.content_type ?? "",
                browser_download_url: a.browser_download_url ?? "",
              })) ?? [],
          },
          repository: repoInfo,
          organization: evt.org ? { login: evt.org.login, id: 0 } : undefined,
        } as Json;
      } catch {
        return null;
      }
    }

    default:
      return null;
  }
}
