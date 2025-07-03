import { syncSingleRepoMetadataTask } from "@/trigger/sync-single-repo-metadata";
import { createClient } from "@/utils/supabase/server";

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
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  const accessToken = process.env.GITHUB_TOKEN;
  const { data: newRepo } = await supabase
    .from("repositories")
    .upsert({ org, repo }, { onConflict: "org,repo" })
    .select("id")
    .single()
    .throwOnError();
  await supabase
    .from("repositories_secure")
    .upsert(
      {
        id: newRepo.id,
        secret,
        access_token: accessToken,
        champion_github_username: senderLogin,
      },
      { onConflict: "id" }
    )
    .throwOnError();
  const { data: fetchedRepo } = await supabase
    .from("repositories")
    .select("*, repositories_secure ( secret )")
    .eq("id", newRepo.id)
    .single();

  await syncSingleRepoMetadataTask.trigger({
    org,
    repo,
  });
  return fetchedRepo;
}
