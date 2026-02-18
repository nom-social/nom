import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeItem(item: any) {
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
    org: item.org,
    repo: item.repo,
    title,
    summary,
    url,
    author,
    contributors,
    updated_at: item.updated_at,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ org: string; repo: string }> }
) {
  const { org, repo } = await params;
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const supabase = await createClient();

  // Look up the repository to get its ID
  const { data: repoData, error: repoError } = await supabase
    .from("repositories")
    .select("id")
    .eq("org", org)
    .eq("repo", repo)
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

  const items = (data ?? []).map((item) => {
    // Inject org/repo from path params since we know them
    return normalizeItem({ ...item, org, repo });
  });
  const has_more = items.length === limit;

  return NextResponse.json({
    items,
    pagination: { offset, limit, has_more },
  });
}
