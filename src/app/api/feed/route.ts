import { NextRequest, NextResponse } from "next/server";

import { normalizeTimelineItem } from "@/app/api/feed/normalize";
import { parseSearchFilters } from "@/lib/feed-utils";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "5", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const filters = parseSearchFilters(q);
  const supabase = await createClient();

  let queryBuilder = supabase
    .from("public_timeline")
    .select("*, repositories!inner ( org, repo )");

  if (filters.org || filters.owner) {
    queryBuilder = queryBuilder.eq(
      "repositories.org",
      filters.org || filters.owner || "",
    );
  }
  if (filters.repo) {
    queryBuilder = queryBuilder.eq("repositories.repo", filters.repo);
  }
  if (filters.type) {
    queryBuilder = queryBuilder.eq("type", filters.type);
  }
  if (filters.from) {
    queryBuilder = queryBuilder.gte(
      "updated_at",
      new Date(filters.from).toISOString(),
    );
  }
  if (filters.to) {
    queryBuilder = queryBuilder.lte(
      "updated_at",
      new Date(filters.to).toISOString(),
    );
  }
  if (filters.textQuery?.trim()) {
    queryBuilder = queryBuilder.textSearch(
      "search_vector",
      filters.textQuery.trim(),
      {
        type: "websearch",
        config: "english",
      },
    );
  }
  if (filters.meme === "true") {
    queryBuilder = queryBuilder.like("search_text", "%![%");
  } else if (filters.meme === "false") {
    queryBuilder = queryBuilder.not("search_text", "like", "%![%");
  }

  const { data, error } = await queryBuilder
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (data ?? []).map(normalizeTimelineItem);
  const has_more = items.length === limit;

  return NextResponse.json({
    items,
    pagination: { offset, limit, has_more },
  });
}
