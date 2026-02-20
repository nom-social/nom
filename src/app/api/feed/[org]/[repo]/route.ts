import { NextRequest, NextResponse } from "next/server";

import { normalizeTimelineItem } from "@/app/api/feed/normalize";
import { escapeForIlike } from "@/lib/repo-utils";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ org: string; repo: string }> }
) {
  const { org, repo } = await params;
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "5", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const supabase = await createClient();

  // Look up the repository to get its ID
  const { data: repoData, error: repoError } = await supabase
    .from("repositories")
    .select("id")
    .ilike("org", escapeForIlike(org))
    .ilike("repo", escapeForIlike(repo))
    .single();

  if (repoError || !repoData) {
    return NextResponse.json(
      { error: "Repository not found" },
      { status: 404 }
    );
  }

  let queryBuilder = supabase
    .from("public_timeline")
    .select("*, org:repositories!inner(org), repo:repositories!inner(repo)")
    .eq("repo_id", repoData.id);

  if (q && q.trim()) {
    const tsquery = q
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

  const items = (data ?? []).map((item) =>
    normalizeTimelineItem({ ...item, org, repo })
  );
  const has_more = items.length === limit;

  return NextResponse.json({
    items,
    pagination: { offset, limit, has_more },
  });
}
