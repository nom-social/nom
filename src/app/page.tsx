import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { Suspense } from "react";

import ClaimRepoButton from "@/components/shared/claim-repo-button";
import { createClient } from "@/utils/supabase/server";
import { getQueryClient } from "@/utils/get-query-client";

import {
  fetchPublicFeed,
  type PublicFeedItemWithLikes,
} from "./page/feed/actions";
import { fetchPublicFeedServer } from "./page/feed/server";
import Feed from "./page/feed";

const LIMIT = 20;

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const queryClient = getQueryClient();
  await queryClient.prefetchInfiniteQuery({
    queryKey: [fetchPublicFeed.key, ""],
    queryFn: ({ pageParam }) =>
      fetchPublicFeedServer({
        limit: LIMIT,
        offset: pageParam,
        query: "",
      }),
    getNextPageParam: (
      lastPage: { items: PublicFeedItemWithLikes[]; hasMore: boolean },
      allPages: { items: PublicFeedItemWithLikes[]; hasMore: boolean }[]
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
        <Suspense
          fallback={
            <div className="flex flex-row items-center gap-2 text-muted-foreground">
              <Loader className="animate-spin w-4 h-4" /> Loading...
            </div>
          }
        >
          <Feed user={user} />
        </Suspense>
      </HydrationBoundary>
    </div>
  );
}
