import { syncSingleRepoMetadataTask } from "@/trigger/sync-single-repo-metadata";
import { createClient } from "@/utils/supabase/server";

// TODO: Make this a batch operation
export async function createNewRepo({
  supabase,
  org,
  repo,
  senderLogin,
}: {
  org: string;
  repo: string;
  supabase: ReturnType<typeof createClient>;
  senderLogin: string;
}) {
  const accessToken = process.env.GITHUB_TOKEN;
  const { data: user } = await supabase
    .from("users")
    .select("id, github_username")
    .eq("github_username", senderLogin)
    .single();

  const { data: newRepo } = await supabase
    .from("repositories")
    .upsert(
      { org, repo, champion_github_username: user ? null : senderLogin },
      { onConflict: "org,repo" }
    )
    .select("id")
    .single()
    .throwOnError();
  await supabase
    .from("repositories_secure")
    .upsert(
      {
        id: newRepo.id,
        access_token: accessToken,
      },
      { onConflict: "id" }
    )
    .throwOnError();

  if (user) {
    await supabase
      .from("repositories_users")
      .upsert(
        { user_id: user.id, repo_id: newRepo.id },
        { onConflict: "user_id,repo_id" }
      )
      .throwOnError();
  }

  const { data: fetchedRepo } = await supabase
    .from("repositories")
    .select("*, repositories_secure ( secret )")
    .eq("id", newRepo.id)
    .single();

  // TODO: Make this a batch operation
  await syncSingleRepoMetadataTask.trigger({
    org,
    repo,
  });
  return fetchedRepo;
}
