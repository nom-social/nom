import { fetchQuery } from "convex/nextjs";

import ClaimRepoButton from "@/components/shared/claim-repo-button";
import { api } from "@/../convex/_generated/api";
import Feed from "./page/feed";
import { type PublicFeedItemWithLikes } from "./page/feed/actions";

export default async function Home() {
  let initialItems: PublicFeedItemWithLikes[] = [];
  try {
    const result = await fetchQuery(api.feed.fetchPublicFeed, {
      paginationOpts: { numItems: 20, cursor: null },
    });
    initialItems = result.page as PublicFeedItemWithLikes[];
  } catch {
    // Non-fatal: client will load feed via Convex subscription
  }

  return (
    <div className="px-2 flex flex-col gap-4">
      <ClaimRepoButton />
      <Feed initialItems={initialItems} />
    </div>
  );
}
