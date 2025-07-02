import { syncSingleRepoMetadataTask } from "@/trigger/sync-single-repo-metadata";
import { createClient } from "@/utils/supabase/server";

export async function createNewRepo({
  supabase,
  org,
  repo,
}: {
  org: string;
  repo: string;
  supabase: ReturnType<typeof createClient>;
}) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  const { data: newRepo } = await supabase
    .from("repositories")
    .insert({ org, repo })
    .select("id")
    .single()
    .throwOnError();
  await supabase
    .from("repositories_secure")
    .insert({ repo_id: newRepo.id, secret })
    .throwOnError();
  const { data: fetchedRepo } = await supabase
    .from("repositories")
    .select("id, repositories_secure ( secret )")
    .eq("id", newRepo.id)
    .single();

  await syncSingleRepoMetadataTask.trigger({
    org,
    repo,
  });
  return fetchedRepo;
}
