import { redirect } from "next/navigation";

import ClaimRepoButton from "@/components/shared/claim-repo-button";
import { auth } from "@convex-dev/auth/nextjs/server";

import FollowingFeed from "./page/feed";

export default async function FollowingPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/auth/login");
  }

  return (
    <div className="px-2 flex flex-col gap-4">
      <ClaimRepoButton />
      <FollowingFeed />
    </div>
  );
}
