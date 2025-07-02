import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/app/layout/profile-dropdown/actions";

import { fetchRepoCount } from "./claim-repo-button/actions";

export default async function ClaimRepoButton() {
  const user = await getCurrentUser();
  const repoCount = await fetchRepoCount();

  if (repoCount > 0) return null;

  if (!user) {
    return (
      <Link href="/auth/login">
        <Button size="sm" className="w-full bg-[var(--nom-yellow)] text-black">
          Connect your repo 🎉
        </Button>
      </Link>
    );
  }

  return (
    <a
      href="https://github.com/apps/nom-social-club/installations/new"
      target="_blank"
    >
      <Button size="sm" className="w-full bg-[var(--nom-yellow)] text-black">
        Connect your repo 🎉
      </Button>
    </a>
  );
}
