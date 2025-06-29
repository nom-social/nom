import { notFound } from "next/navigation";

import RepoProfileCard from "@/components/[org]/[repo]/repo-profile-card";
import PRCard from "@/components/activity-cards/pr-card";
import { Separator } from "@/components/ui/separator";

import { fetchRepoProfile } from "./actions";

export default async function RepoPage({
  params,
}: {
  params: { org: string; repo: string };
}) {
  const { org, repo } = params;
  const repoProfile = await fetchRepoProfile(org, repo);

  if (!repoProfile) return notFound();

  return (
    <div className="flex flex-col justify-center gap-4 px-2">
      <RepoProfileCard
        org={org}
        repo={repo}
        createdAt={repoProfile.createdAt}
        description={repoProfile.description}
        websiteUrl={repoProfile.websiteUrl}
        avatarUrl={repoProfile.avatarUrl}
        topLanguages={repoProfile.topLanguages.slice(0, 3)}
        license={repoProfile.license}
      />

      <div className="flex flex-row gap-2 items-center">
        <p className="text-muted-foreground text-xs">Recent activities</p>
        <Separator className="flex-1" />
      </div>

      <PRCard
        title="fix: Resolve race condition in data fetching"
        contributors={[
          { name: "Alex Kim", avatar: "https://github.com/alex.png" },
          { name: "Sarah Chen", avatar: "https://github.com/sarah.png" },
        ]}
        body={
          "Fixed a critical race condition in the data fetching layer that was " +
          "causing intermittent failures. Added proper request cancellation and " +
          "implemented a request queue system."
        }
        prUrl="https://github.com/org/repo/pull/124"
        repo={repo}
        org={org}
        state="merged"
        createdAt={new Date("2025-01-01")}
        liked={false}
        likeCount={0}
      />
    </div>
  );
}
