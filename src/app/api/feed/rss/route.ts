import { NextRequest, NextResponse } from "next/server";

import { normalizeTimelineItem } from "@/app/api/feed/normalize";
import { toErrorXml, toRssXml } from "@/app/api/feed/to-rss";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "5", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("public_timeline")
    .select("*, repositories!inner ( org, repo )")
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return new NextResponse(toErrorXml(error.message), {
      status: 500,
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }

  const items = (data ?? []).map(normalizeTimelineItem);
  const baseUrl =
    request.nextUrl.origin ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://beta.nomit.dev");

  const feedUrl = `${baseUrl}${request.nextUrl.pathname}${request.nextUrl.search}`;

  const xml = toRssXml(items, {
    title: "Nom — GitHub Activity Feed",
    link: baseUrl,
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
}
