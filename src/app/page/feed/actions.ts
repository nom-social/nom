import { parseSearchFilters } from "@/lib/feed-utils";
import { api } from "@/../convex/_generated/api";
import { Doc, Id } from "@/../convex/_generated/dataModel";

export type FeedItem = Doc<"userTimeline"> & {
  repository: (Doc<"repositories"> & { _id: Id<"repositories"> }) | null;
};

export type FeedItemWithLikes = FeedItem & {
  likeCount: number;
  isLiked: boolean;
};

export type PublicFeedItem = Doc<"publicTimeline"> & {
  repository: (Doc<"repositories"> & { _id: Id<"repositories"> }) | null;
};

export type PublicFeedItemWithLikes = PublicFeedItem & {
  likeCount: number;
  isLiked: boolean;
};

export class NotAuthenticatedError extends Error {
  constructor() {
    super("Not authenticated");
  }
}

/**
 * Build Convex feed query args from a search query string.
 * Used by both the client components and API routes.
 */
export function buildFeedQueryArgs(
  query?: string,
  repositoryId?: Id<"repositories">,
) {
  const filters = parseSearchFilters(query);

  return {
    textQuery: filters.textQuery || undefined,
    type: filters.type,
    repositoryId,
    fromMs: filters.from ? new Date(filters.from).getTime() : undefined,
    toMs: filters.to ? new Date(filters.to).getTime() : undefined,
    meme: filters.meme,
  };
}

// Re-export the Convex API refs so feed components can use them
export { api };
