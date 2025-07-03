import { Button } from "@/components/ui/button";

import { fetchRepoCount } from "./claim-repo-button/actions";

export default async function ClaimRepoButton() {
  const repoCount = await fetchRepoCount();

  if (repoCount > 0) return null;

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
