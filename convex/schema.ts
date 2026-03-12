import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // @convex-dev/auth tables (sessions, authAccounts, etc.)
  ...authTables,

  // Override users table to add custom fields
  users: defineTable({
    // From authTables.users
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Custom fields
    githubUsername: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("by_github_username", ["githubUsername"]),

  repositories: defineTable({
    org: v.string(),
    repo: v.string(),
    metadata: v.optional(v.any()),
    championGithubUsername: v.optional(v.string()),
    isPrivate: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_org_repo", ["org", "repo"])
    .index("by_champion", ["championGithubUsername"]),

  repositoriesSecure: defineTable({
    repositoryId: v.id("repositories"),
    installationId: v.number(),
    createdAt: v.number(),
  }).index("by_repository", ["repositoryId"]),

  repositoriesUsers: defineTable({
    repositoryId: v.id("repositories"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_repository", ["repositoryId"])
    .index("by_user_repository", ["userId", "repositoryId"]),

  subscriptions: defineTable({
    userId: v.id("users"),
    repositoryId: v.id("repositories"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_repository", ["repositoryId"])
    .index("by_user_repository", ["userId", "repositoryId"]),

  publicTimeline: defineTable({
    repositoryId: v.id("repositories"),
    data: v.any(),
    type: v.string(),
    score: v.number(),
    isRead: v.boolean(),
    categories: v.optional(v.array(v.string())),
    snoozeTo: v.optional(v.number()),
    searchText: v.optional(v.string()),
    eventIds: v.optional(v.array(v.string())),
    dedupeHash: v.string(),
    updatedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_dedupe_hash", ["dedupeHash"])
    .index("by_repository", ["repositoryId"])
    .index("by_updated_at", ["updatedAt"])
    .index("by_repository_updated_at", ["repositoryId", "updatedAt"])
    .searchIndex("search_text", {
      searchField: "searchText",
      filterFields: ["type", "repositoryId"],
    }),

  userTimeline: defineTable({
    userId: v.id("users"),
    repositoryId: v.id("repositories"),
    data: v.any(),
    type: v.string(),
    score: v.number(),
    isRead: v.boolean(),
    categories: v.optional(v.array(v.string())),
    snoozeTo: v.optional(v.number()),
    searchText: v.optional(v.string()),
    eventIds: v.optional(v.array(v.string())),
    dedupeHash: v.string(),
    updatedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_updated_at", ["userId", "updatedAt"])
    .index("by_user_dedupe_hash", ["userId", "dedupeHash"])
    .index("by_dedupe_hash", ["dedupeHash"])
    .searchIndex("search_text", {
      searchField: "searchText",
      filterFields: ["userId", "type", "repositoryId"],
    }),

  githubEventLog: defineTable({
    eventType: v.string(),
    action: v.optional(v.string()),
    org: v.string(),
    repo: v.string(),
    rawPayload: v.any(),
    lastProcessed: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_org_repo", ["org", "repo"])
    .index("by_org_repo_unprocessed", ["org", "repo", "lastProcessed"]),

  timelineLikes: defineTable({
    userId: v.id("users"),
    dedupeHash: v.string(),
    createdAt: v.number(),
  })
    .index("by_user_dedupe_hash", ["userId", "dedupeHash"])
    .index("by_dedupe_hash", ["dedupeHash"]),

  notifications: defineTable({
    type: v.string(),
    entityId: v.string(),
    key: v.string(),
    createdAt: v.number(),
  }).index("by_type_entity_key", ["type", "entityId", "key"]),
});
