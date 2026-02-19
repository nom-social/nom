import { NextRequest, NextResponse } from "next/server";

import { normalizeTimelineItem } from "@/app/api/feed/normalize";
import { toRssXml } from "@/app/api/feed/to-rss";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ org: string; repo: string }> }
) {
  const { org, repo } = await params;
  const { searchParams } = request.nextUrl;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const supabase = await createClient();

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

  const { data, error } = await supabase
    .from("public_timeline")
    .select("*, org:repositories!inner(org), repo:repositories!inner(repo)")
    .eq("repo_id", repoData.id)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (data ?? []).map((item) =>
    normalizeTimelineItem({ ...item, org, repo })
  );

  const baseUrl =
    request.nextUrl.origin ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://beta.nomit.dev");

  const feedUrl = `${baseUrl}${request.nextUrl.pathname}${request.nextUrl.search}`;
  const channelLink = `${baseUrl}/${org}/${repo}`;

  const xml = toRssXml(items, {
    title: `Nom — ${org}/${repo} Activity`,
    link: channelLink,
    description: `GitHub activity feed for ${org}/${repo}: pull requests, issues, releases, and pushes with AI summaries.`,
    feedUrl,
  });

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}
