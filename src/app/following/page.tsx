import { redirect } from "next/navigation";

import ClaimRepoButton from "@/components/shared/claim-repo-button";
import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";

import FollowingFeed from "./page/feed";

export default async function FollowingPage() {
  const isAuthenticated = await isAuthenticatedNextjs();

  if (!isAuthenticated) {
    redirect("/auth/login");
  }

  return (
    <div className="px-2 flex flex-col gap-4">
      <ClaimRepoButton />
      <FollowingFeed />
    </div>
  );
}
