import { z } from "zod";

export const githubUserSchema = z.object({
  login: z.string(),
  id: z.number(),
});

export const githubOrgSchema = z.object({
  login: z.string(),
  id: z.number(),
});

export const githubRepositorySchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  owner: githubUserSchema,
  default_branch: z.string(),
});

// Base schema for all webhook payloads
export const githubWebhookBaseSchema = z.object({
  action: z.string().optional(),
  organization: githubOrgSchema.optional(),
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
    action: z.enum(["closed"]),
  }),
  z.object({
    event_type: z.literal("release"),
    ...githubWebhookBaseSchema.shape,
  }),
  z.object({
    event_type: z.literal("push"),
    ref: z.string(),
    ...githubWebhookBaseSchema.shape,
  }),
  z.object({
    event_type: z.literal("installation"),
    action: z.string().optional(),
    repositories: z.array(z.object({ full_name: z.string() })),
    sender: githubUserSchema,
    installation: z.object({ id: z.number() }),
  }),
  z.object({
    event_type: z.literal("installation_repositories"),
    action: z.string().optional(),
    repositories_added: z.array(z.object({ full_name: z.string() })),
    repositories_removed: z.array(z.object({ full_name: z.string() })),
    sender: githubUserSchema,
    installation: z.object({ id: z.number() }),
  }),
  z.object({
    event_type: z.literal("repository"),
    ...githubWebhookBaseSchema.shape,
    action: z.string(),
    sender: githubUserSchema,
  }),
]);

// Infer types from Zod schemas
export type GitHubWebhookPayload = z.infer<typeof githubWebhookPayloadSchema>;
