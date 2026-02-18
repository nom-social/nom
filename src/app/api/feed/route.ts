import { NextRequest, NextResponse } from "next/server";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeItem(item: any) {
  const org = item.repositories?.org ?? "";
  const repo = item.repositories?.repo ?? "";
  const data = item.data ?? {};
  const type: string = item.type ?? "";

  let title = "";
  let url = "";
  let author = "";
  let summary = "";
  let contributors: string[] = [];

  if (type === "pull_request" && data.pull_request) {
    const pr = data.pull_request;
    title = pr.title ?? "";
    url = pr.html_url ?? "";
    author = pr.user?.login ?? "";
    summary = pr.ai_summary ?? "";
    contributors = pr.contributors ?? [];
  } else if (type === "issue" && data.issue) {
    const issue = data.issue;
    title = issue.title ?? "";
    url = issue.html_url ?? "";
    author = issue.user?.login ?? "";
    summary = issue.ai_summary ?? "";
    contributors = issue.contributors ?? [];
  } else if (type === "release" && data.release) {
    const release = data.release;
    title = release.name || release.tag_name || "";
    url = release.html_url ?? "";
    author = release.author?.login ?? "";
    summary = release.ai_summary ?? "";
    contributors = release.contributors ?? [];
  } else if (type === "push" && data.push) {
    const push = data.push;
    title = push.title ?? "";
    url = push.html_url ?? "";
    author = push.contributors?.[0] ?? "";
    summary = push.ai_summary ?? "";
    contributors = push.contributors ?? [];
  }

  return {
    id: item.id,
    type,
    org,
    repo,
    title,
    summary,
    url,
    author,
    contributors,
    updated_at: item.updated_at,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const filters = parseSearchFilters(q);
  const supabase = await createClient();

  let queryBuilder = supabase
    .from("public_timeline")
    .select("*, repositories!inner ( org, repo )");

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

  if (filters.textQuery) {
    const tsquery = filters.textQuery
      .trim()
      .split(/\s+/)
      .map((word) => word.replace(/[^\w]/g, ""))
      .filter((word) => word.length > 0)
      .join(" & ");

    if (tsquery) {
      queryBuilder = queryBuilder.textSearch("search_vector", tsquery);
    }
  }

  const { data, error } = await queryBuilder
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (data ?? []).map(normalizeItem);
  const has_more = items.length === limit;

  return NextResponse.json({
    items,
    pagination: { offset, limit, has_more },
  });
}
