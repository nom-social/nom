import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import ClaimRepoButton from "@/components/shared/claim-repo-button";
import { BASE_URL } from "@/lib/constants";
import { createClient } from "@/utils/supabase/server";
import { getQueryClient } from "@/utils/get-query-client";

import {
  fetchPublicFeed,
  type PublicFeedItemWithLikes,
} from "./page/feed/actions";
import { fetchPublicFeedServer } from "./page/feed/server";
import Feed from "./page/feed";

const LIMIT = 20;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;

  const apiUrl = q
    ? `${BASE_URL}/api/feed?q=${encodeURIComponent(q)}`
    : `${BASE_URL}/api/feed`;

  return {
    alternates: {
      types: {
        "application/json": apiUrl,
      },
    },
    other: {
      "nom-api":
        "This page is client-rendered. For feed data, use GET " +
        apiUrl +
        " (JSON, no auth). See /llms.txt for full API docs.",
    },
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const normalizedQ = q ?? "";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery({
    queryKey: [fetchPublicFeed.key, normalizedQ],
    queryFn: ({ pageParam }) =>
      fetchPublicFeedServer({
        limit: LIMIT,
        offset: pageParam,
        query: normalizedQ,
      }),
    getNextPageParam: (
      lastPage: { items: PublicFeedItemWithLikes[]; hasMore: boolean },
      allPages: { items: PublicFeedItemWithLikes[]; hasMore: boolean }[],
    ) => {
      if (lastPage.hasMore) {
        return allPages.reduce((acc, page) => acc + page.items.length, 0);
      }
      return undefined;
    },
    initialPageParam: 0,
  });

  return (
    <div className="px-2 flex flex-col gap-4">
      <ClaimRepoButton />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Feed user={user} />
      </HydrationBoundary>
    </div>
  );
}
