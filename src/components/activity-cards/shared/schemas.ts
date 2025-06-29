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
