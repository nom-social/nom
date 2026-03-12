import { createAdminConvexClient } from "@/utils/convex/client";
import { api } from "@/../convex/_generated/api";

/**
 * Ensures a public-only repo exists in the repositories table.
 * Does NOT create repositoriesSecure, so the repo will use unauthenticated
 * Octokit fallback when processing events.
 */
export async function ensurePublicRepo({
  org,
  repo,
}: {
  org: string;
  repo: string;
}) {
  const convex = createAdminConvexClient();
  await convex.mutation(api.admin.upsertRepository, { org, repo });
}
