import { z } from "zod";

export const githubUserSchema = z.object({
  login: z.string(),
  id: z.number(),
});

export const githubRepositorySchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  owner: githubUserSchema,
});

export const githubLabelSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string(),
});

export const githubCommentSchema = z.object({
  id: z.number(),
  body: z.string(),
  user: githubUserSchema,
  created_at: z.string(),
  updated_at: z.string(),
  in_reply_to_id: z.number().optional(),
});

export const githubReviewSchema = z.object({
  id: z.number(),
  state: z.string(),
  body: z.string(),
  user: githubUserSchema,
  commit_id: z.string(),
});

export const githubPullRequestSchema = z.object({
  id: z.number(),
  number: z.number(),
  title: z.string(),
  state: z.string(),
  merged: z.boolean(),
  user: githubUserSchema,
  requested_reviewers: z.array(githubUserSchema),
});

export const githubIssueSchema = z.object({
  id: z.number(),
  number: z.number(),
  title: z.string(),
  state: z.string(),
  user: githubUserSchema,
  labels: z.array(githubLabelSchema),
  assignees: z.array(githubUserSchema),
});

export const githubReleaseSchema = z.object({
  id: z.number(),
  tag_name: z.string(),
  name: z.string(),
  body: z.string(),
  prerelease: z.boolean(),
  author: githubUserSchema,
});

export const githubCommitSchema = z.object({
  id: z.string(),
  message: z.string(),
  author: z.object({
    name: z.string(),
    email: z.string(),
  }),
});

// Base schema for all webhook payloads
export const githubWebhookBaseSchema = z.object({
  action: z.string().optional(),
  sender: githubUserSchema.optional(),
  actor: githubUserSchema.optional(),
  organization: githubUserSchema.optional(),
  repository: githubRepositorySchema.optional(),
});

// Event-specific schemas
export const pullRequestWebhookSchema = githubWebhookBaseSchema.extend({
  pull_request: githubPullRequestSchema,
  review: githubReviewSchema.optional(),
});

export const issueWebhookSchema = githubWebhookBaseSchema.extend({
  issue: githubIssueSchema,
});

export const releaseWebhookSchema = githubWebhookBaseSchema.extend({
  release: githubReleaseSchema,
});

export const commentWebhookSchema = githubWebhookBaseSchema.extend({
  comment: githubCommentSchema,
});

export const pushWebhookSchema = githubWebhookBaseSchema.extend({
  ref: z.string(),
  commits: z.array(githubCommitSchema),
});

export const statusWebhookSchema = githubWebhookBaseSchema.extend({
  state: z.string(),
  context: z.string(),
  description: z.string(),
  target_url: z.string(),
});

export const pingWebhookSchema = githubWebhookBaseSchema.extend({
  zen: z.string(),
  hook_id: z.number(),
});

// Union type for all possible webhook payloads
export const githubWebhookPayloadSchema = z.discriminatedUnion("event_type", [
  z.object({
    event_type: z.literal("ping"),
    ...githubWebhookBaseSchema.shape,
  }),
  z.object({
    event_type: z.literal("pull_request"),
    ...pullRequestWebhookSchema.shape,
  }),
  z.object({
    event_type: z.literal("pull_request_review"),
    ...pullRequestWebhookSchema.shape,
  }),
  z.object({ event_type: z.literal("issues"), ...issueWebhookSchema.shape }),
  z.object({ event_type: z.literal("release"), ...releaseWebhookSchema.shape }),
  z.object({
    event_type: z.literal("issue_comment"),
    ...commentWebhookSchema.shape,
  }),
  z.object({
    event_type: z.literal("pull_request_review_comment"),
    ...commentWebhookSchema.shape,
  }),
  z.object({ event_type: z.literal("push"), ...pushWebhookSchema.shape }),
  z.object({ event_type: z.literal("status"), ...statusWebhookSchema.shape }),
]);

// Infer types from Zod schemas
export type GitHubWebhookPayload = z.infer<typeof githubWebhookPayloadSchema>;
