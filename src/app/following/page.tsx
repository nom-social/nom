import { redirect } from "next/navigation";

import ClaimRepoButton from "@/components/shared/claim-repo-button";
import { createClient } from "@/utils/supabase/server";

import FollowingFeed from "./page/feed";

export default async function FollowingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="px-2 flex flex-col gap-4">
      <ClaimRepoButton />
      <FollowingFeed />
    </div>
  );
}
