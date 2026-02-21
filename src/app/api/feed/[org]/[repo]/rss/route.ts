import { NextRequest, NextResponse } from "next/server";

import { normalizeTimelineItem } from "@/app/api/feed/normalize";
import { toErrorXml, toRssXml } from "@/app/api/feed/to-rss";
import { BASE_URL } from "@/lib/constants";
import { escapeForIlike } from "@/lib/repo-utils";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ org: string; repo: string }> }
) {
  const { org, repo } = await params;
  const { searchParams } = request.nextUrl;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "5", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const supabase = await createClient();

  const { data: repoData, error: repoError } = await supabase
    .from("repositories")
    .select("id")
    .ilike("org", escapeForIlike(org))
    .ilike("repo", escapeForIlike(repo))
    .single();

  if (repoError || !repoData) {
    return new NextResponse(toErrorXml("Repository not found"), {
      status: 404,
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }

  const { data, error } = await supabase
    .from("public_timeline")
    .select("*, org:repositories!inner(org), repo:repositories!inner(repo)")
    .eq("repo_id", repoData.id)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return new NextResponse(toErrorXml(error.message), {
      status: 500,
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }

  const items = (data ?? []).map((item) =>
    normalizeTimelineItem({ ...item, org, repo })
  );

  const feedUrl = `${BASE_URL}${request.nextUrl.pathname}${request.nextUrl.search}`;
  const channelLink = `${BASE_URL}/${org}/${repo}`;

  const xml = toRssXml(items, {
    title: `Nom — ${org}/${repo} Activity`,
    link: channelLink,
    description: `GitHub activity feed for ${org}/${repo}: pull requests, releases, and pushes with AI summaries.`,
    feedUrl,
  });

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}
