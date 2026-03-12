import { fetchQuery } from "convex/nextjs";
import { api } from "@/../convex/_generated/api";

export type FeedItemWithLikes = {
  _id: string;
  type: string;
  data: unknown;
  dedupeHash: string;
  likeCount: number;
  isLiked: boolean;
  isPrivate: boolean;
  repository: { org: string; repo: string } | null;
};

export async function fetchFeedItem({
  statusId,
  repo,
  org,
}: {
  statusId: string;
  repo: string;
  org: string;
}): Promise<FeedItemWithLikes | null> {
  const item = await fetchQuery(api.feed.fetchFeedItem, {
    dedupeHash: statusId,
    org,
    repo,
  });

  if (!item) return null;

  return {
    _id: item._id,
    type: item.type,
    data: item.data,
    dedupeHash: item.dedupeHash,
    likeCount: item.likeCount,
    isLiked: item.isLiked,
    isPrivate: item.isPrivate,
    repository: item.repository
      ? { org: item.repository.org, repo: item.repository.repo }
      : null,
  };
}
