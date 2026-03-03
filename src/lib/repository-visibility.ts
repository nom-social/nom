import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/types/supabase";

type RepoVisibilityRecord = Pick<Tables<"repositories">, "id" | "is_private">;

export async function canUserAccessRepo(
  supabase: SupabaseClient<Database>,
  repo: RepoVisibilityRecord,
  userId?: string
) {
  if (!repo.is_private) {
    return true;
  }

  if (!userId) {
    return false;
  }

  const { data: membership } = await supabase
    .from("repositories_users")
    .select("id")
    .eq("repo_id", repo.id)
    .eq("user_id", userId)
    .maybeSingle()
    .throwOnError();

  return Boolean(membership);
}

export async function fetchOwnedRepoIds(
  supabase: SupabaseClient<Database>,
  userId?: string
) {
  if (!userId) {
    return [];
  }

  const { data } = await supabase
    .from("repositories_users")
    .select("repo_id")
    .eq("user_id", userId)
    .throwOnError();

  return data.map(({ repo_id }) => repo_id);
}

export function toPostgrestInList(values: string[]) {
  return values.map((value) => `"${value}"`).join(",");
}
