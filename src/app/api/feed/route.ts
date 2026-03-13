import { NextRequest, NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";

import { normalizeTimelineItem } from "@/app/api/feed/normalize";
import { parseSearchFilters } from "@/lib/feed-utils";
import { api } from "@/../convex/_generated/api";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "5", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const filters = parseSearchFilters(q);

  try {
    const items = await fetchQuery(api.admin.getPublicFeedSlice, {
      limit,
      offset,
      type: filters.type,
      textQuery: filters.textQuery || undefined,
      meme: filters.meme,
      fromMs: filters.from ? new Date(filters.from).getTime() : undefined,
      toMs: filters.to ? new Date(filters.to).getTime() : undefined,
    });

    const normalizedItems = items.map(
      (item: {
        _id: string;
        type: string;
        data: unknown;
        dedupeHash: string;
        updatedAt: number;
        repository?: { org: string; repo: string } | null;
      }) =>
        normalizeTimelineItem({
          id: item._id,
          type: item.type,
          data: item.data,
          updated_at: new Date(item.updatedAt).toISOString(),
          dedupe_hash: item.dedupeHash,
          repositories: item.repository
            ? { org: item.repository.org, repo: item.repository.repo }
            : undefined,
        }),
    );

    const has_more = normalizedItems.length > limit;
    const page = normalizedItems.slice(0, limit);

    return NextResponse.json({
      items: page,
      pagination: { offset, limit, has_more },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
