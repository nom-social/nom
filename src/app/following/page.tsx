import { Loader } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";

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
      <Suspense
        fallback={
          <div className="flex flex-row items-center gap-2 text-muted-foreground">
            <Loader className="animate-spin w-4 h-4" /> Loading...
          </div>
        }
      >
        <FollowingFeed />
      </Suspense>
    </div>
  );
}
