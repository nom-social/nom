import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Loader } from "lucide-react";

import { BASE_URL } from "@/lib/constants";
import { getQueryClient } from "@/utils/get-query-client";

import RepoProfileCard from "./page/repo-profile-card";
import { fetchRepoProfile } from "./page/actions";
import { fetchFeedPage, type FetchFeedPageResult } from "./page/feed/actions";
import { fetchFeedPageServer } from "./page/feed/server";
import Feed from "./page/feed";

const LIMIT = 20;

export default async function RepoPage({
  params,
}: {
  params: Promise<{ org: string; repo: string }>;
}) {
  const { org, repo } = await params;
  const repoProfile = await fetchRepoProfile(org, repo);

  if (!repoProfile) return notFound();

  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery({
    queryKey: [fetchFeedPage.key, repoProfile.id, ""],
    queryFn: ({ pageParam }) =>
      fetchFeedPageServer({
        repoId: repoProfile.id,
        limit: LIMIT,
        offset: pageParam,
        query: "",
      }),
    getNextPageParam: (
      lastPage: FetchFeedPageResult,
      allPages: FetchFeedPageResult[]
    ) => {
      if (lastPage.hasMore) {
        return allPages.reduce((acc, page) => acc + page.items.length, 0);
      }
      return undefined;
    },
    initialPageParam: 0,
  });

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

      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense
          fallback={
            <div className="flex flex-row items-center gap-2 text-muted-foreground">
              <Loader className="animate-spin w-4 h-4" /> Loading...
            </div>
          }
        >
          <Feed repoId={repoProfile.id} repo={repo} org={org} />
        </Suspense>
      </HydrationBoundary>
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
