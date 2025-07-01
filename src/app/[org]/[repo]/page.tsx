import { notFound } from "next/navigation";
import type { Metadata } from "next";

import RepoProfileCard from "@/components/[org]/[repo]/repo-profile-card";
import { Separator } from "@/components/ui/separator";

import { fetchRepoProfile } from "./actions";
import Feed from "./page/feed";

export default async function RepoPage({
  params,
}: {
  params: Promise<{ org: string; repo: string }>;
}) {
  const { org, repo } = await params;
  const repoProfile = await fetchRepoProfile(org, repo);

  if (!repoProfile) return notFound();

  return (
    <main className="flex flex-col justify-center gap-4 px-2">
      <RepoProfileCard
        org={org}
        repo={repo}
        createdAt={repoProfile.createdAt}
        description={repoProfile.description}
        websiteUrl={repoProfile.websiteUrl}
        avatarUrl={repoProfile.avatarUrl}
        topLanguages={repoProfile.topLanguages.slice(0, 3)}
        license={repoProfile.license}
        initialSubscriptionCount={repoProfile.subscriptionCount}
      />

      <div className="flex flex-row gap-2 items-center">
        <p className="text-muted-foreground text-xs">Recent activities</p>
        <Separator className="flex-1" />
      </div>

      <Feed repoId={repoProfile.id} repo={repo} org={org} />
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ org: string; repo: string }>;
}): Promise<Metadata> {
  const { org, repo } = await params;
  const repoProfile = await fetchRepoProfile(org, repo);

  if (!repoProfile) return {};

  const truncate = (str: string) =>
    str.length > 200 ? str.slice(0, 200) + "..." : str;
  const description = truncate(
    repoProfile.description || `View ${repo}/${org} on Nom.`
  );

  return {
    title: `${org}/${repo} - Nom`,
    description,
    openGraph: {
      title: `${repo}/${org} - Nom`,
      description,
      url: `http://nomit.dev/${org}/${repo}`,
      images: [
        {
          url: repoProfile.avatarUrl,
          alt: `${org} avatar`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${repo}/${org} - Nom`,
      description,
      images: [repoProfile.avatarUrl],
    },
  };
}
