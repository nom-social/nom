import { v } from "convex/values";
import { subMonths } from "date-fns";

import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const isSubscribed = query({
  args: { org: v.string(), repo: v.string() },
  handler: async (ctx, { org, repo }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { subscribed: false };

    const repository = await findRepo(ctx, org, repo);
    if (!repository) return { subscribed: false };

    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_repository", (q) =>
        q.eq("userId", userId).eq("repositoryId", repository._id),
      )
      .unique();

    return { subscribed: !!sub };
  },
});

export const subscribe = mutation({
  args: { org: v.string(), repo: v.string() },
  handler: async (ctx, { org, repo }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const repository = await findRepo(ctx, org, repo);
    if (!repository) throw new Error("Repository not found");

    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_repository", (q) =>
        q.eq("userId", userId).eq("repositoryId", repository._id),
      )
      .unique();

    if (!existing) {
      await ctx.db.insert("subscriptions", {
        userId,
        repositoryId: repository._id,
        createdAt: Date.now(),
      });
    }

    // Copy last month's public_timeline events to user_timeline
    const oneMonthAgoMs = subMonths(new Date(), 1).getTime();
    const publicEvents = await ctx.db
      .query("publicTimeline")
      .withIndex("by_repository_updated_at", (q) =>
        q.eq("repositoryId", repository._id),
      )
      .filter((q) => q.gte(q.field("createdAt"), oneMonthAgoMs))
      .collect();

    for (const event of publicEvents) {
      const existingEntry = await ctx.db
        .query("userTimeline")
        .withIndex("by_user_dedupe_hash", (q) =>
          q.eq("userId", userId).eq("dedupeHash", event.dedupeHash),
        )
        .unique();

      if (!existingEntry) {
        await ctx.db.insert("userTimeline", {
          userId,
          repositoryId: event.repositoryId,
          data: event.data,
          type: event.type,
          score: event.score,
          isRead: false,
          categories: event.categories,
          snoozeTo: event.snoozeTo,
          searchText: event.searchText,
          eventIds: event.eventIds,
          dedupeHash: event.dedupeHash,
          createdAt: event.createdAt,
          updatedAt: Date.now(),
        });
      }
    }

    return repository._id;
  },
});

export const unsubscribe = mutation({
  args: { org: v.string(), repo: v.string() },
  handler: async (ctx, { org, repo }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const repository = await findRepo(ctx, org, repo);
    if (!repository) throw new Error("Repository not found");

    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_repository", (q) =>
        q.eq("userId", userId).eq("repositoryId", repository._id),
      )
      .unique();

    if (sub) await ctx.db.delete(sub._id);
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function findRepo(
  ctx: Parameters<typeof isSubscribed.handler>[0],
  org: string,
  repo: string,
) {
  // Try exact match first (case-insensitive stored as lowercase)
  return (
    (await ctx.db
      .query("repositories")
      .withIndex("by_org_repo", (q) =>
        q.eq("org", org.toLowerCase()).eq("repo", repo.toLowerCase()),
      )
      .first()) ??
    // Fallback: scan with filter for case-insensitive match
    (await ctx.db
      .query("repositories")
      .filter((q) =>
        q.and(
          q.eq(q.field("org"), org),
          q.eq(q.field("repo"), repo),
        ),
      )
      .first())
  );
}
