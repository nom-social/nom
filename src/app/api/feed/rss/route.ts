import { NextRequest, NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";

import { normalizeTimelineItem } from "@/app/api/feed/normalize";
import { toErrorXml, toRssXml } from "@/app/api/feed/to-rss";
import { BASE_URL } from "@/lib/constants";
import { api } from "@/../convex/_generated/api";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "5", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  try {
    const items = await fetchQuery(api.admin.getPublicFeedSlice, {
      limit,
      offset,
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

    const feedUrl = `${BASE_URL}${request.nextUrl.pathname}${request.nextUrl.search}`;

    const xml = toRssXml(normalizedItems, {
      title: "Nom — GitHub Activity Feed",
      link: BASE_URL,
      description:
        "GitHub activity feed: pull requests, releases, and pushes from public repositories with AI summaries.",
      feedUrl,
    });

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=60, s-maxage=60",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return new NextResponse(toErrorXml(message), {
      status: 500,
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }
}
