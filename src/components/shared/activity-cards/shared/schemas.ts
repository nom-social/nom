import { z } from "zod";

export const prDataSchema = z.object({
  action: z.string(),
  pull_request: z.object({
    stats: z.object({
      comments_count: z.number(),
      additions: z.number(),
      deletions: z.number(),
      changed_files: z.number(),
    }),
    head_checks: z.object({
      total: z.number(),
      passing: z.number(),
      failing: z.number(),
    }),
    head: z.object({ ref: z.string() }),
    base: z.object({ ref: z.string() }),
    user: z.object({ login: z.string() }),
    number: z.number(),
    title: z.string(),
    body: z.string().nullable(),
    html_url: z.string(),
    created_at: z.string(),
    ai_summary: z.string(),
    requested_reviewers: z.array(z.object({ login: z.string() })).optional(),
    merged: z.boolean(),
    contributors: z.array(z.string()),
  }),
});

export type PrData = z.infer<typeof prDataSchema>;

export const issueDataSchema = z.object({
  action: z.string(),
  issue: z.object({
    user: z.object({ login: z.string() }),
    number: z.number(),
    title: z.string(),
    body: z.string().nullable(),
    html_url: z.string(),
    created_at: z.string(),
    assignees: z.array(z.object({ login: z.string() })),
    state: z.enum(["open", "closed"]),
    contributors: z.array(z.string()),
    ai_summary: z.string(),
  }),
});

export type IssueData = z.infer<typeof issueDataSchema>;

export const releaseDataSchema = z.object({
  action: z.string(),
  release: z.object({
    tag_name: z.string(),
    name: z.string().nullable(),
    body: z.string().nullable(),
    html_url: z.string(),
    created_at: z.string(),
    published_at: z.string().nullable(),
    author: z.object({ login: z.string() }),
    assets: z.array(
      z.object({
        name: z.string(),
        size: z.number(),
        download_count: z.number(),
        content_type: z.string(),
        browser_download_url: z.string(),
      })
    ),
    contributors: z.array(z.string()),
    ai_summary: z.string(),
  }),
});

export type ReleaseData = z.infer<typeof releaseDataSchema>;
