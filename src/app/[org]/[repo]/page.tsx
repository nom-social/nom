import { fetchQuery } from "convex/nextjs";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { BASE_URL } from "@/lib/constants";
import { api } from "@/../convex/_generated/api";
import { type PublicFeedItemWithLikes } from "@/app/page/feed/actions";

import RepoProfileCard from "./page/repo-profile-card";
import { fetchRepoProfile } from "./page/actions";
import Feed from "./page/feed";

export default async function RepoPage({
  params,
}: {
  params: Promise<{ org: string; repo: string }>;
}) {
  const { org, repo } = await params;
  const repoProfile = await fetchRepoProfile(org, repo);

  if (!repoProfile) return notFound();

  let initialItems: PublicFeedItemWithLikes[] = [];
  try {
    const result = await fetchQuery(api.feed.fetchPublicFeed, {
      paginationOpts: { numItems: 20, cursor: null },
      repositoryId: repoProfile._id,
    });
    initialItems = result.page as PublicFeedItemWithLikes[];
  } catch {
    // Non-fatal: client will load feed via Convex subscription
  }

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
        isPrivate={repoProfile.isPrivate}
      />

      <Feed
        repositoryId={repoProfile._id}
        repo={repo}
        org={org}
        initialItems={initialItems}
      />
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
    repoProfile.description || `View ${repo}/${org} on Nom.`,
  );

  return {
    title: `${org}/${repo} - Nom`,
    description,
    openGraph: {
      title: `${repo}/${org} - Nom`,
      description,
      url: `${BASE_URL}/${org}/${repo}`,
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
