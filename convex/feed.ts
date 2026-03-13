import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Fetch the public feed with optional filters and pagination.
 */
export const fetchPublicFeed = query({
  args: {
    paginationOpts: paginationOptsValidator,
    textQuery: v.optional(v.string()),
    type: v.optional(v.string()),
    repositoryId: v.optional(v.id("repositories")),
    fromMs: v.optional(v.number()),
    toMs: v.optional(v.number()),
    meme: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    let paginatedResult;

    if (args.textQuery) {
      // Text search path
      const searchQ = ctx.db
        .query("publicTimeline")
        .withSearchIndex("search_text", (q) => {
          let sq = q.search("searchText", args.textQuery!);
          if (args.type) sq = sq.eq("type", args.type);
          if (args.repositoryId) sq = sq.eq("repositoryId", args.repositoryId);
          return sq;
        });
      paginatedResult = await searchQ.paginate(args.paginationOpts);
    } else {
      // Index path
      const indexQ = args.repositoryId
        ? ctx.db
            .query("publicTimeline")
            .withIndex("by_repository_updated_at", (q) =>
              q.eq("repositoryId", args.repositoryId!),
            )
            .order("desc")
        : ctx.db
            .query("publicTimeline")
            .withIndex("by_updated_at")
            .order("desc");

      paginatedResult = await indexQ.paginate(args.paginationOpts);
    }

    // Apply in-memory filters (type, date range, meme)
    let items = paginatedResult.page;
    if (args.type) {
      items = items.filter((item) => item.type === args.type);
    }
    if (args.fromMs) {
      items = items.filter((item) => item.updatedAt >= args.fromMs!);
    }
    if (args.toMs) {
      items = items.filter((item) => item.updatedAt <= args.toMs!);
    }
    if (args.meme === "true") {
      items = items.filter((item) => item.searchText?.includes("![") ?? false);
    } else if (args.meme === "false") {
      items = items.filter(
        (item) => !(item.searchText?.includes("![") ?? false),
      );
    }

    // Join repository data
    const enriched = await Promise.all(
      items.map(async (item) => {
        const repository = await ctx.db.get(item.repositoryId);
        return { ...item, repository };
      }),
    );

    // Batch fetch like data
    const dedupeHashes = enriched.map((item) => item.dedupeHash);
    const likeData = await batchGetLikeData(ctx, dedupeHashes, userId);

    return {
      ...paginatedResult,
      page: enriched.map((item) => ({
        ...item,
        likeCount: likeData[item.dedupeHash]?.count ?? 0,
        isLiked: likeData[item.dedupeHash]?.userLiked ?? false,
      })),
    };
  },
});

/**
 * Fetch the authenticated user's personal feed with optional filters and pagination.
 */
export const fetchUserFeed = query({
  args: {
    paginationOpts: paginationOptsValidator,
    textQuery: v.optional(v.string()),
    type: v.optional(v.string()),
    repositoryId: v.optional(v.id("repositories")),
    fromMs: v.optional(v.number()),
    toMs: v.optional(v.number()),
    meme: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { page: [], isDone: true, continueCursor: "" };

    let paginatedResult;

    if (args.textQuery) {
      const searchQ = ctx.db
        .query("userTimeline")
        .withSearchIndex("search_text", (q) => {
          let sq = q.search("searchText", args.textQuery!).eq("userId", userId);
          if (args.type) sq = sq.eq("type", args.type);
          if (args.repositoryId) sq = sq.eq("repositoryId", args.repositoryId);
          return sq;
        });
      paginatedResult = await searchQ.paginate(args.paginationOpts);
    } else {
      paginatedResult = await ctx.db
        .query("userTimeline")
        .withIndex("by_user_updated_at", (q) => q.eq("userId", userId))
        .order("desc")
        .paginate(args.paginationOpts);
    }

    // Apply in-memory filters
    let items = paginatedResult.page;
    if (args.type) {
      items = items.filter((item) => item.type === args.type);
    }
    if (args.fromMs) {
      items = items.filter((item) => item.updatedAt >= args.fromMs!);
    }
    if (args.toMs) {
      items = items.filter((item) => item.updatedAt <= args.toMs!);
    }
    if (args.meme === "true") {
      items = items.filter((item) => item.searchText?.includes("![") ?? false);
    } else if (args.meme === "false") {
      items = items.filter(
        (item) => !(item.searchText?.includes("![") ?? false),
      );
    }

    // Join repository data
    const enriched = await Promise.all(
      items.map(async (item) => {
        const repository = await ctx.db.get(item.repositoryId);
        return { ...item, repository };
      }),
    );

    // Batch fetch like data
    const dedupeHashes = enriched.map((item) => item.dedupeHash);
    const likeData = await batchGetLikeData(ctx, dedupeHashes, userId);

    return {
      ...paginatedResult,
      page: enriched.map((item) => ({
        ...item,
        likeCount: likeData[item.dedupeHash]?.count ?? 0,
        isLiked: likeData[item.dedupeHash]?.userLiked ?? false,
      })),
    };
  },
});

/**
 * Fetch a single timeline item by dedupeHash for the status page.
 */
export const fetchFeedItem = query({
  args: {
    dedupeHash: v.string(),
    org: v.string(),
    repo: v.string(),
  },
  handler: async (ctx, { dedupeHash, org, repo }) => {
    const userId = await getAuthUserId(ctx);

    const repository = await ctx.db
      .query("repositories")
      .withIndex("by_org_repo", (q) =>
        q.eq("org", org.toLowerCase()).eq("repo", repo.toLowerCase()),
      )
      .first();

    // Case-insensitive fallback
    const repoDoc =
      repository ??
      (await ctx.db
        .query("repositories")
        .filter((q) =>
          q.and(q.eq(q.field("org"), org), q.eq(q.field("repo"), repo)),
        )
        .first());

    if (!repoDoc) return null;

    const item = await ctx.db
      .query("publicTimeline")
      .withIndex("by_dedupe_hash", (q) => q.eq("dedupeHash", dedupeHash))
      .first();

    if (!item || item.repositoryId !== repoDoc._id) return null;

    const likeData = await batchGetLikeData(ctx, [dedupeHash], userId);

    return {
      ...item,
      repository: repoDoc,
      isPrivate: repoDoc.isPrivate,
      likeCount: likeData[dedupeHash]?.count ?? 0,
      isLiked: likeData[dedupeHash]?.userLiked ?? false,
    };
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function batchGetLikeData(
  ctx: Parameters<typeof fetchPublicFeed.handler>[0],
  dedupeHashes: string[],
  userId: string | null,
) {
  const result: Record<string, { count: number; userLiked: boolean }> = {};

  await Promise.all(
    dedupeHashes.map(async (hash) => {
      const likes = await ctx.db
        .query("timelineLikes")
        .withIndex("by_dedupe_hash", (q) => q.eq("dedupeHash", hash))
        .collect();

      const userLiked = userId ? likes.some((l) => l.userId === userId) : false;
      result[hash] = { count: likes.length, userLiked };
    }),
  );

  return result;
}
