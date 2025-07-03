import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";
export async function fetchRepoCount() {
  const supabase = createClient(cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const userId = user.id;

  const { count } = await supabase
    .from("repositories_users")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .throwOnError();

  return count ?? 0;
}

fetchRepoCount.key =
  "src/components/shared/claim-repo-button/actions/fetchRepoCount";
