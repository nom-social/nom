/**
 * Admin/backend functions called by Trigger.dev tasks and API routes.
 * These are public but intended for server-to-server use only.
 */
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

// ---------------------------------------------------------------------------
// GitHub Event Log
// ---------------------------------------------------------------------------

export const insertGithubEvent = mutation({
  args: {
    eventType: v.string(),
    action: v.optional(v.string()),
    org: v.string(),
    repo: v.string(),
    rawPayload: v.any(),
    createdAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("githubEventLog", {
      eventType: args.eventType,
      action: args.action,
      org: args.org,
      repo: args.repo,
      rawPayload: args.rawPayload,
      createdAt: args.createdAt ?? Date.now(),
    });
  },
});

export const getUnprocessedEvents = query({
  args: { org: v.string(), repo: v.string() },
  handler: async (ctx, { org, repo }) => {
    return ctx.db
      .query("githubEventLog")
      .withIndex("by_org_repo", (q) => q.eq("org", org).eq("repo", repo))
      .filter((q) => q.eq(q.field("lastProcessed"), undefined))
      .order("asc")
      .collect();
  },
});

export const markEventProcessed = mutation({
  args: { eventId: v.id("githubEventLog") },
  handler: async (ctx, { eventId }) => {
    await ctx.db.patch(eventId, { lastProcessed: Date.now() });
  },
});

export const insertGithubEvents = mutation({
  args: {
    events: v.array(
      v.object({
        eventType: v.string(),
        action: v.optional(v.string()),
        org: v.string(),
        repo: v.string(),
        rawPayload: v.any(),
        createdAt: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, { events }) => {
    for (const event of events) {
      await ctx.db.insert("githubEventLog", {
        eventType: event.eventType,
        action: event.action,
        org: event.org,
        repo: event.repo,
        rawPayload: event.rawPayload,
        createdAt: event.createdAt ?? Date.now(),
      });
    }
  },
});

// ---------------------------------------------------------------------------
// Repositories
// ---------------------------------------------------------------------------

export const getRepository = query({
  args: { org: v.string(), repo: v.string() },
  handler: async (ctx, { org, repo }) => {
    return (
      (await ctx.db
        .query("repositories")
        .withIndex("by_org_repo", (q) =>
          q.eq("org", org.toLowerCase()).eq("repo", repo.toLowerCase()),
        )
        .first()) ??
      (await ctx.db
        .query("repositories")
        .filter((q) =>
          q.and(q.eq(q.field("org"), org), q.eq(q.field("repo"), repo)),
        )
        .first())
    );
  },
});

export const upsertRepository = mutation({
  args: {
    org: v.string(),
    repo: v.string(),
    championGithubUsername: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("repositories")
      .withIndex("by_org_repo", (q) =>
        q.eq("org", args.org).eq("repo", args.repo),
      )
      .first();

    if (existing) {
      const update: Record<string, unknown> = {};
      if (args.championGithubUsername !== undefined)
        update.championGithubUsername = args.championGithubUsername;
      if (args.isPrivate !== undefined) update.isPrivate = args.isPrivate;
      if (args.metadata !== undefined) update.metadata = args.metadata;
      await ctx.db.patch(existing._id, update);
      return existing._id;
    }

    return ctx.db.insert("repositories", {
      org: args.org,
      repo: args.repo,
      championGithubUsername: args.championGithubUsername,
      isPrivate: args.isPrivate ?? false,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
  },
});

export const updateRepositoryMetadata = mutation({
  args: {
    repositoryId: v.id("repositories"),
    metadata: v.any(),
    isPrivate: v.optional(v.boolean()),
  },
  handler: async (ctx, { repositoryId, metadata, isPrivate }) => {
    const update: Record<string, unknown> = { metadata };
    if (isPrivate !== undefined) update.isPrivate = isPrivate;
    await ctx.db.patch(repositoryId, update);
  },
});

export const upsertRepositorySecure = mutation({
  args: {
    repositoryId: v.id("repositories"),
    installationId: v.number(),
  },
  handler: async (ctx, { repositoryId, installationId }) => {
    const existing = await ctx.db
      .query("repositoriesSecure")
      .withIndex("by_repository", (q) => q.eq("repositoryId", repositoryId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { installationId });
    } else {
      await ctx.db.insert("repositoriesSecure", {
        repositoryId,
        installationId,
        createdAt: Date.now(),
      });
    }
  },
});

export const getRepositoriesByIds = query({
  args: { repositoryIds: v.array(v.id("repositories")) },
  handler: async (ctx, { repositoryIds }) => {
    return Promise.all(repositoryIds.map((id) => ctx.db.get(id)));
  },
});

export const getRepositorySecure = query({
  args: { repositoryId: v.id("repositories") },
  handler: async (ctx, { repositoryId }) => {
    return ctx.db
      .query("repositoriesSecure")
      .withIndex("by_repository", (q) => q.eq("repositoryId", repositoryId))
      .unique();
  },
});

export const listRepositories = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("repositories").collect();
  },
});

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const getUserByGithubUsername = query({
  args: { githubUsername: v.string() },
  handler: async (ctx, { githubUsername }) => {
    return ctx.db
      .query("users")
      .withIndex("by_github_username", (q) =>
        q.eq("githubUsername", githubUsername),
      )
      .unique();
  },
});

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return ctx.db.get(userId);
  },
});

export const getUsersByIds = query({
  args: { userIds: v.array(v.id("users")) },
  handler: async (ctx, { userIds }) => {
    return Promise.all(userIds.map((id) => ctx.db.get(id)));
  },
});

export const getGitHubAccessToken = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", userId).eq("provider", "github"),
      )
      .unique();

    if (!account?.secret) return null;
    try {
      const parsed = JSON.parse(account.secret as string);
      return (parsed.access_token as string) ?? null;
    } catch {
      return null;
    }
  },
});

// ---------------------------------------------------------------------------
// Repositories Users
// ---------------------------------------------------------------------------

export const upsertRepositoryUser = mutation({
  args: {
    userId: v.id("users"),
    repositoryId: v.id("repositories"),
  },
  handler: async (ctx, { userId, repositoryId }) => {
    const existing = await ctx.db
      .query("repositoriesUsers")
      .withIndex("by_user_repository", (q) =>
        q.eq("userId", userId).eq("repositoryId", repositoryId),
      )
      .unique();

    if (!existing) {
      await ctx.db.insert("repositoriesUsers", {
        userId,
        repositoryId,
        createdAt: Date.now(),
      });
    }
  },
});

export const getRepositoryUsers = query({
  args: { repositoryId: v.id("repositories") },
  handler: async (ctx, { repositoryId }) => {
    return ctx.db
      .query("repositoriesUsers")
      .withIndex("by_repository", (q) => q.eq("repositoryId", repositoryId))
      .collect();
  },
});

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

export const getSubscribers = query({
  args: { repositoryId: v.id("repositories") },
  handler: async (ctx, { repositoryId }) => {
    return ctx.db
      .query("subscriptions")
      .withIndex("by_repository", (q) => q.eq("repositoryId", repositoryId))
      .collect();
  },
});

export const getSubscriberCount = query({
  args: { repositoryId: v.id("repositories") },
  handler: async (ctx, { repositoryId }) => {
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_repository", (q) => q.eq("repositoryId", repositoryId))
      .collect();
    return subs.length;
  },
});

export const getUserSubscriptions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const upsertSubscription = mutation({
  args: {
    userId: v.id("users"),
    repositoryId: v.id("repositories"),
  },
  handler: async (ctx, { userId, repositoryId }) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_repository", (q) =>
        q.eq("userId", userId).eq("repositoryId", repositoryId),
      )
      .unique();

    if (!existing) {
      await ctx.db.insert("subscriptions", {
        userId,
        repositoryId,
        createdAt: Date.now(),
      });
    }
  },
});

export const deleteSubscription = mutation({
  args: {
    userId: v.id("users"),
    repositoryId: v.id("repositories"),
  },
  handler: async (ctx, { userId, repositoryId }) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_repository", (q) =>
        q.eq("userId", userId).eq("repositoryId", repositoryId),
      )
      .unique();

    if (sub) await ctx.db.delete(sub._id);
  },
});

// ---------------------------------------------------------------------------
// Public Timeline
// ---------------------------------------------------------------------------

export const upsertPublicTimelineEntry = mutation({
  args: {
    repositoryId: v.id("repositories"),
    data: v.any(),
    type: v.string(),
    score: v.number(),
    isRead: v.optional(v.boolean()),
    categories: v.optional(v.array(v.string())),
    snoozeTo: v.optional(v.number()),
    searchText: v.optional(v.string()),
    eventIds: v.optional(v.array(v.string())),
    dedupeHash: v.string(),
    createdAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("publicTimeline")
      .withIndex("by_dedupe_hash", (q) => q.eq("dedupeHash", args.dedupeHash))
      .unique();

    const now = Date.now();
    const entry = {
      repositoryId: args.repositoryId,
      data: args.data,
      type: args.type,
      score: args.score,
      isRead: args.isRead ?? false,
      categories: args.categories,
      snoozeTo: args.snoozeTo,
      searchText: args.searchText,
      eventIds: args.eventIds,
      dedupeHash: args.dedupeHash,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, entry);
      return existing._id;
    }

    return ctx.db.insert("publicTimeline", {
      ...entry,
      createdAt: args.createdAt ?? now,
    });
  },
});

export const upsertPublicTimelineEntries = mutation({
  args: {
    entries: v.array(
      v.object({
        repositoryId: v.id("repositories"),
        data: v.any(),
        type: v.string(),
        score: v.number(),
        isRead: v.optional(v.boolean()),
        categories: v.optional(v.array(v.string())),
        snoozeTo: v.optional(v.number()),
        searchText: v.optional(v.string()),
        eventIds: v.optional(v.array(v.string())),
        dedupeHash: v.string(),
        createdAt: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, { entries }) => {
    const now = Date.now();
    for (const args of entries) {
      const existing = await ctx.db
        .query("publicTimeline")
        .withIndex("by_dedupe_hash", (q) => q.eq("dedupeHash", args.dedupeHash))
        .unique();

      const entry = {
        repositoryId: args.repositoryId,
        data: args.data,
        type: args.type,
        score: args.score,
        isRead: args.isRead ?? false,
        categories: args.categories,
        snoozeTo: args.snoozeTo,
        searchText: args.searchText,
        eventIds: args.eventIds,
        dedupeHash: args.dedupeHash,
        updatedAt: now,
      };

      if (existing) {
        await ctx.db.patch(existing._id, entry);
      } else {
        await ctx.db.insert("publicTimeline", {
          ...entry,
          createdAt: args.createdAt ?? now,
        });
      }
    }
  },
});

export const expireSnoozedPublicTimeline = mutation({
  args: { currentTimeMs: v.number() },
  handler: async (ctx, { currentTimeMs }) => {
    const snoozed = await ctx.db
      .query("publicTimeline")
      .filter((q) =>
        q.and(
          q.neq(q.field("snoozeTo"), undefined),
          q.lt(q.field("snoozeTo"), currentTimeMs),
        ),
      )
      .collect();

    for (const item of snoozed) {
      await ctx.db.patch(item._id, {
        snoozeTo: undefined,
        updatedAt: currentTimeMs,
      });
    }
  },
});

export const getPublicTimelineForRepo = query({
  args: {
    repositoryId: v.id("repositories"),
    fromMs: v.optional(v.number()),
    toMs: v.optional(v.number()),
  },
  handler: async (ctx, { repositoryId, fromMs, toMs }) => {
    const q = ctx.db
      .query("publicTimeline")
      .withIndex("by_repository_updated_at", (q) =>
        q.eq("repositoryId", repositoryId),
      );

    if (fromMs || toMs) {
      return (await q.collect()).filter(
        (item) =>
          (!fromMs || item.updatedAt >= fromMs) &&
          (!toMs || item.updatedAt <= toMs),
      );
    }

    return q.collect();
  },
});

// ---------------------------------------------------------------------------
// User Timeline
// ---------------------------------------------------------------------------

export const upsertUserTimelineEntries = mutation({
  args: {
    entries: v.array(
      v.object({
        userId: v.id("users"),
        repositoryId: v.id("repositories"),
        data: v.any(),
        type: v.string(),
        score: v.number(),
        isRead: v.optional(v.boolean()),
        categories: v.optional(v.array(v.string())),
        snoozeTo: v.optional(v.number()),
        searchText: v.optional(v.string()),
        eventIds: v.optional(v.array(v.string())),
        dedupeHash: v.string(),
        createdAt: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, { entries }) => {
    const now = Date.now();
    for (const args of entries) {
      const existing = await ctx.db
        .query("userTimeline")
        .withIndex("by_user_dedupe_hash", (q) =>
          q.eq("userId", args.userId).eq("dedupeHash", args.dedupeHash),
        )
        .unique();

      const entry = {
        userId: args.userId,
        repositoryId: args.repositoryId,
        data: args.data,
        type: args.type,
        score: args.score,
        isRead: args.isRead ?? false,
        categories: args.categories,
        snoozeTo: args.snoozeTo,
        searchText: args.searchText,
        eventIds: args.eventIds,
        dedupeHash: args.dedupeHash,
        updatedAt: now,
      };

      if (existing) {
        await ctx.db.patch(existing._id, entry);
      } else {
        await ctx.db.insert("userTimeline", {
          ...entry,
          createdAt: args.createdAt ?? now,
        });
      }
    }
  },
});

export const expireSnoozedUserTimeline = mutation({
  args: { currentTimeMs: v.number() },
  handler: async (ctx, { currentTimeMs }) => {
    const snoozed = await ctx.db
      .query("userTimeline")
      .filter((q) =>
        q.and(
          q.neq(q.field("snoozeTo"), undefined),
          q.lt(q.field("snoozeTo"), currentTimeMs),
        ),
      )
      .collect();

    for (const item of snoozed) {
      await ctx.db.patch(item._id, {
        snoozeTo: undefined,
        updatedAt: currentTimeMs,
      });
    }
  },
});

// ---------------------------------------------------------------------------
// Likes
// ---------------------------------------------------------------------------

export const getPublicTimelineByDedupeHash = query({
  args: { dedupeHash: v.string() },
  handler: async (ctx, { dedupeHash }) => {
    return ctx.db
      .query("publicTimeline")
      .withIndex("by_dedupe_hash", (q) => q.eq("dedupeHash", dedupeHash))
      .unique();
  },
});

export const getLikeCount = query({
  args: { dedupeHash: v.string() },
  handler: async (ctx, { dedupeHash }) => {
    const likes = await ctx.db
      .query("timelineLikes")
      .withIndex("by_dedupe_hash", (q) => q.eq("dedupeHash", dedupeHash))
      .collect();
    return likes.length;
  },
});

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const getNotifications = query({
  args: {
    type: v.string(),
    entityId: v.string(),
    keys: v.array(v.string()),
  },
  handler: async (ctx, { type, entityId, keys }) => {
    const all = await ctx.db
      .query("notifications")
      .withIndex("by_type_entity_key", (q) =>
        q.eq("type", type).eq("entityId", entityId),
      )
      .collect();
    return all.filter((n) => keys.includes(n.key));
  },
});

export const insertNotification = mutation({
  args: {
    type: v.string(),
    entityId: v.string(),
    key: v.string(),
  },
  handler: async (ctx, { type, entityId, key }) => {
    const existing = await ctx.db
      .query("notifications")
      .withIndex("by_type_entity_key", (q) =>
        q.eq("type", type).eq("entityId", entityId).eq("key", key),
      )
      .unique();

    if (!existing) {
      await ctx.db.insert("notifications", {
        type,
        entityId,
        key,
        createdAt: Date.now(),
      });
    }
  },
});

// ---------------------------------------------------------------------------
// Public feed (for API routes - simple slice-based pagination)
// ---------------------------------------------------------------------------

export const getPublicFeedSlice = query({
  args: {
    limit: v.number(),
    offset: v.number(),
    type: v.optional(v.string()),
    repositoryId: v.optional(v.id("repositories")),
    textQuery: v.optional(v.string()),
    meme: v.optional(v.string()),
    fromMs: v.optional(v.number()),
    toMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const take = Math.min(args.offset + args.limit + 1, 500);

    let items;
    if (args.textQuery) {
      items = await ctx.db
        .query("publicTimeline")
        .withSearchIndex("search_text", (q) => {
          let sq = q.search("searchText", args.textQuery!);
          if (args.type) sq = sq.eq("type", args.type);
          if (args.repositoryId) sq = sq.eq("repositoryId", args.repositoryId);
          return sq;
        })
        .take(take);
    } else if (args.repositoryId) {
      items = await ctx.db
        .query("publicTimeline")
        .withIndex("by_repository_updated_at", (q) =>
          q.eq("repositoryId", args.repositoryId!),
        )
        .order("desc")
        .take(take);
    } else {
      items = await ctx.db
        .query("publicTimeline")
        .withIndex("by_updated_at")
        .order("desc")
        .take(take);
    }

    // In-memory filters
    if (args.type) items = items.filter((i) => i.type === args.type);
    if (args.fromMs) items = items.filter((i) => i.updatedAt >= args.fromMs!);
    if (args.toMs) items = items.filter((i) => i.updatedAt <= args.toMs!);
    if (args.meme === "true")
      items = items.filter((i) => i.searchText?.includes("![") ?? false);
    else if (args.meme === "false")
      items = items.filter((i) => !(i.searchText?.includes("![") ?? false));

    const page = items.slice(args.offset, args.offset + args.limit + 1);

    // Join repositories
    const enriched = await Promise.all(
      page.map(async (item) => {
        const repository = await ctx.db.get(item.repositoryId);
        return { ...item, repository };
      }),
    );

    return enriched;
  },
});
