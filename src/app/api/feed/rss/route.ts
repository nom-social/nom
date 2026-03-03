import { NextRequest, NextResponse } from "next/server";

import { normalizeTimelineItem } from "@/app/api/feed/normalize";
import { toErrorXml, toRssXml } from "@/app/api/feed/to-rss";
import { BASE_URL } from "@/lib/constants";
import {
  fetchOwnedRepoIds,
  toPostgrestInList,
} from "@/lib/repository-visibility";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "5", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ownedRepoIds = await fetchOwnedRepoIds(supabase, user?.id);

  let queryBuilder = supabase
    .from("public_timeline")
    .select("*, repositories!inner ( org, repo, is_private )");

  if (ownedRepoIds.length > 0) {
    queryBuilder = queryBuilder.or(
      `repositories.is_private.eq.false,repo_id.in.(${toPostgrestInList(ownedRepoIds)})`
    );
  } else {
    queryBuilder = queryBuilder.eq("repositories.is_private", false);
  }

  const { data, error } = await queryBuilder
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

  const feedUrl = `${BASE_URL}${request.nextUrl.pathname}${request.nextUrl.search}`;

  const xml = toRssXml(items, {
    title: "Nom — GitHub Activity Feed",
    link: BASE_URL,
    description:
      "GitHub activity feed: pull requests, releases, and pushes from public repositories with AI summaries.",
    feedUrl,
  });

  const cacheControl =
    user && ownedRepoIds.length > 0
      ? "private, no-store"
      : "public, max-age=60, s-maxage=60";

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": cacheControl,
    },
  });
}
