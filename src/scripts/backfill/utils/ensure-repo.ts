import { createAdminClient } from "@/utils/supabase/admin";

/**
 * Ensures a public-only repo exists in the repositories table.
 * Does NOT create repositories_secure, so the repo will use unauthenticated
 * Octokit fallback when processing events.
 */
export async function ensurePublicRepo({
  org,
  repo,
}: {
  org: string;
  repo: string;
}) {
  const supabase = createAdminClient();

  await supabase
    .from("repositories")
    .upsert({ org, repo }, { onConflict: "org,repo" })
    .throwOnError();
}
