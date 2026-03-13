import { NextRequest, NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";

import { normalizeTimelineItem } from "@/app/api/feed/normalize";
import { api } from "@/../convex/_generated/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ org: string; repo: string }> },
) {
  const { org, repo } = await params;
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "5", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  // Look up the repository
  const repoDoc = await fetchQuery(api.admin.getRepository, { org, repo });
  if (!repoDoc) {
    return NextResponse.json(
      { error: "Repository not found" },
      { status: 404 },
    );
  }

  const items = await fetchQuery(api.admin.getPublicFeedSlice, {
    limit,
    offset,
    repositoryId: repoDoc._id,
    textQuery: q?.trim() || undefined,
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
        org,
        repo,
      }),
  );

  const has_more = normalizedItems.length > limit;
  const page = normalizedItems.slice(0, limit);

  return NextResponse.json({
    items: page,
    pagination: { offset, limit, has_more },
  });
}
