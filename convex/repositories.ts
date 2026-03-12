import { v } from "convex/values";

import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const fetchRepoProfile = query({
  args: { org: v.string(), repo: v.string() },
  handler: async (ctx, { org, repo }) => {
    const repoDoc = await findRepo(ctx, org, repo);
    if (!repoDoc) return null;

    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_repository", (q) => q.eq("repositoryId", repoDoc._id))
      .collect();

    return {
      ...repoDoc,
      subscriptionCount: subs.length,
    };
  },
});

export const fetchRepoCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const links = await ctx.db
      .query("repositoriesUsers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return links.length;
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function findRepo(
  ctx: Parameters<typeof fetchRepoProfile.handler>[0],
  org: string,
  repo: string,
) {
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
}
