import { notFound } from "next/navigation";

import RepoProfileCard from "@/components/[org]/[repo]/repo-profile-card";

import { fetchRepoProfile } from "./actions";
import { Separator } from "@/components/ui/separator";

type Props = {
  params: { org: string; repo: string };
};

export default async function RepoPage({ params }: Props) {
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
    </div>
  );
}
