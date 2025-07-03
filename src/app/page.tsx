import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";
import ClaimRepoButton from "@/components/shared/claim-repo-button";

import Feed from "./page/feed";

export default async function Home() {
  const supabase = createClient(cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="px-2 flex flex-col gap-4">
      <ClaimRepoButton />
      <Feed user={user} />
    </div>
  );
}
