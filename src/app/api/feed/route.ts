import { NextRequest, NextResponse } from "next/server";

import { normalizeTimelineItem } from "@/app/api/feed/normalize";
import {
  fetchOwnedRepoIds,
  toPostgrestInList,
} from "@/lib/repository-visibility";
import { createClient } from "@/utils/supabase/server";

interface SearchFilters {
  org?: string;
  repo?: string;
  type?: string;
  from?: string;
  to?: string;
  textQuery: string;
  owner?: string;
}

function parseSearchFilters(query?: string): SearchFilters {
  if (!query || !query.trim()) {
    return { textQuery: "" };
  }

  const filters: SearchFilters = { textQuery: "" };
  let remainingText = query;

  const filterPatterns = {
    org: /\borg:(\S+)/g,
    repo: /\brepo:(\S+)/g,
    type: /\btype:(\S+)/g,
    from: /\bfrom:(\S+)/g,
    to: /\bto:(\S+)/g,
    owner: /\bowner:(\S+)/g,
  };

  Object.entries(filterPatterns).forEach(([key, pattern]) => {
    const matches = [...remainingText.matchAll(pattern)];
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      filters[key as keyof SearchFilters] = lastMatch[1];
      remainingText = remainingText.replace(pattern, "");
    }
  });

  filters.textQuery = remainingText.replace(/\s+/g, " ").trim();
  return filters;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "5", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const filters = parseSearchFilters(q);
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

  if (filters.org || filters.owner) {
    queryBuilder = queryBuilder.eq(
      "repositories.org",
      filters.org || filters.owner || ""
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
      new Date(filters.from).toISOString()
    );
  }
  if (filters.to) {
    queryBuilder = queryBuilder.lte(
      "updated_at",
      new Date(filters.to).toISOString()
    );
  }
  if (filters.textQuery?.trim()) {
    queryBuilder = queryBuilder.textSearch(
      "search_vector",
      filters.textQuery.trim(),
      {
        type: "websearch",
        config: "english",
      }
    );
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
