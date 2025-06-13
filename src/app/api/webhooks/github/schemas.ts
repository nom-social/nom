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

// Base schema for all webhook payloads
export const githubWebhookBaseSchema = z.object({
  action: z.string().optional(),
  organization: githubUserSchema,
  repository: githubRepositorySchema,
});

// Union type for all possible webhook payloads
export const githubWebhookPayloadSchema = z.discriminatedUnion("event_type", [
  z.object({
    event_type: z.literal("ping"),
    ...githubWebhookBaseSchema.shape,
  }),
  z.object({
    event_type: z.literal("star"),
    ...githubWebhookBaseSchema.shape,
    action: z.enum(["created", "deleted"]),
    sender: githubUserSchema,
  }),
  z.object({
    event_type: z.literal("pull_request"),
    ...githubWebhookBaseSchema.shape,
  }),
  z.object({
    event_type: z.literal("pull_request_review"),
    ...githubWebhookBaseSchema.shape,
  }),
  z.object({
    event_type: z.literal("issues"),
    ...githubWebhookBaseSchema.shape,
  }),
  z.object({
    event_type: z.literal("release"),
    ...githubWebhookBaseSchema.shape,
  }),
  z.object({
    event_type: z.literal("issue_comment"),
    ...githubWebhookBaseSchema.shape,
  }),
  z.object({
    event_type: z.literal("pull_request_review_comment"),
    ...githubWebhookBaseSchema.shape,
  }),
  z.object({
    event_type: z.literal("push"),
    ...githubWebhookBaseSchema.shape,
  }),
  z.object({
    event_type: z.literal("status"),
    ...githubWebhookBaseSchema.shape,
  }),
  z.object({
    event_type: z.literal("create"),
    ...githubWebhookBaseSchema.shape,
  }),
  z.object({
    event_type: z.literal("delete"),
    ...githubWebhookBaseSchema.shape,
  }),
]);

// Infer types from Zod schemas
export type GitHubWebhookPayload = z.infer<typeof githubWebhookPayloadSchema>;
