import { syncBatchReposMetadataTask } from "@/trigger/sync-batch-repos-metadata";
import { createClient } from "@/utils/supabase/server";

export async function createNewRepo({
  supabase,
  repos,
  senderLogin,
  installationId,
}: {
  repos: { org: string; repo: string }[];
  supabase: ReturnType<typeof createClient>;
  senderLogin: string;
  installationId: number;
}) {
  const { data: user } = await supabase
    .from("users")
    .select("id, github_username")
    .eq("github_username", senderLogin)
    .single();

  const { data: newRepos } = await supabase
    .from("repositories")
    .upsert(
      repos.map(({ org, repo }) => ({
        org,
        repo,
        champion_github_username: user ? null : senderLogin,
      })),
      { onConflict: "org,repo" }
    )
    .select("id")
    .throwOnError();
  await supabase
    .from("repositories_secure")
    .upsert(
      newRepos.map(({ id }) => ({
        id,
        installation_id: installationId,
      })),
      { onConflict: "id" }
    )
    .throwOnError();

  if (user) {
    await supabase
      .from("repositories_users")
      .upsert(
        newRepos.map(({ id }) => ({ user_id: user.id, repo_id: id })),
        { onConflict: "user_id,repo_id" }
      )
      .throwOnError();
  }

  const { data: fetchedRepos } = await supabase
    .from("repositories")
    .select("*")
    .in(
      "id",
      newRepos.map(({ id }) => id)
    )
    .throwOnError();

  await syncBatchReposMetadataTask.trigger({
    repos: fetchedRepos.map(({ org, repo }) => ({ org, repo })),
  });
}
