import GitHub from "@auth/core/providers/github";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [GitHub],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      const profile = args.profile as {
        login?: string;
        email?: string | null;
        name?: string;
        avatar_url?: string;
      };

      const githubUsername = profile.login ?? "";
      const email = profile.email ?? "";

      if (args.existingUserId) {
        // Update github username in case it changed
        await ctx.db.patch(args.existingUserId, { githubUsername, email });
        return args.existingUserId;
      }

      const userId = await ctx.db.insert("users", {
        githubUsername,
        email,
        name: profile.name ?? githubUsername,
        image: profile.avatar_url,
      });

      // Link user to repos where they are champion_github_username
      if (githubUsername) {
        const championedRepos = await ctx.db
          .query("repositories")
          .withIndex("by_champion", (q) =>
            q.eq("championGithubUsername", githubUsername),
          )
          .collect();

        for (const repo of championedRepos) {
          // Clear champion field
          await ctx.db.patch(repo._id, {
            championGithubUsername: undefined,
          });

          // Create repositories_users link
          const existing = await ctx.db
            .query("repositoriesUsers")
            .withIndex("by_user_repository", (q) =>
              q.eq("userId", userId).eq("repositoryId", repo._id),
            )
            .unique();

          if (!existing) {
            await ctx.db.insert("repositoriesUsers", {
              userId,
              repositoryId: repo._id,
              createdAt: Date.now(),
            });
          }
        }
      }

      return userId;
    },
  },
});
