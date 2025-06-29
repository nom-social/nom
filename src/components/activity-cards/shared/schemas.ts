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
    ai_analysis: z
      .object({
        summary: z.string(),
        review_time_minutes: z.number(),
        special_considerations: z.array(z.string()),
        change_type: z.enum(["FEATURE", "BUG_FIX", "TECH_DEBT"]),
        change_type_reason: z.string(),
      })
      .nullable(),
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
    ai_analysis: z
      .object({
        summary: z.string(),
        breaking_changes: z.array(z.string()),
        notable_additions: z.array(z.string()),
        migration_notes: z.array(z.string()),
      })
      .nullable(),
    contributors: z.array(z.string()).optional(), // for UI mapping
  }),
});

export type ReleaseData = z.infer<typeof releaseDataSchema>;

export const issueCommentDataSchema = z.object({
  action: z.string(),
  issue: z.object({
    number: z.number(),
    title: z.string(),
    user: z.object({ login: z.string() }),
    state: z.enum(["open", "closed"]),
    html_url: z.string(),
    body: z.string().nullable(),
    created_at: z.string(),
    assignees: z.array(z.object({ login: z.string() })),
  }),
  comment: z.object({
    user: z.object({ login: z.string() }),
    body: z.string(),
    html_url: z.string(),
    created_at: z.string(),
  }),
});

export type IssueCommentData = z.infer<typeof issueCommentDataSchema>;
