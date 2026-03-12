import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const isLiked = query({
  args: { dedupeHash: v.string() },
  handler: async (ctx, { dedupeHash }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { liked: false };

    const like = await ctx.db
      .query("timelineLikes")
      .withIndex("by_user_dedupe_hash", (q) =>
        q.eq("userId", userId).eq("dedupeHash", dedupeHash),
      )
      .unique();

    return { liked: !!like };
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

export const createLike = mutation({
  args: { dedupeHash: v.string() },
  handler: async (ctx, { dedupeHash }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("timelineLikes")
      .withIndex("by_user_dedupe_hash", (q) =>
        q.eq("userId", userId).eq("dedupeHash", dedupeHash),
      )
      .unique();

    if (!existing) {
      await ctx.db.insert("timelineLikes", {
        userId,
        dedupeHash,
        createdAt: Date.now(),
      });
    }
  },
});

export const deleteLike = mutation({
  args: { dedupeHash: v.string() },
  handler: async (ctx, { dedupeHash }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const like = await ctx.db
      .query("timelineLikes")
      .withIndex("by_user_dedupe_hash", (q) =>
        q.eq("userId", userId).eq("dedupeHash", dedupeHash),
      )
      .unique();

    if (like) await ctx.db.delete(like._id);
  },
});
