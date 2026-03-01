import { z } from "zod";

import { escapeForIlike } from "@/lib/repo-utils";
import { canUserAccessRepo } from "@/lib/repository-visibility";
import { createClient } from "@/utils/supabase/server";

const metadataSchema = z.object({
  avatar_url: z.string().url(),
  description: z.string().nullable(),
  created_at: z.string(),
  languages: z.array(
    z.object({
      name: z.string(),
      bytes: z.number(),
    })
  ),
  homepage_url: z.string().url().nullable(),
  license: z.string().nullable(),
});

export async function fetchRepoProfile(org: string, repo: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: repoData } = await supabase
    .from("repositories")
    .select("metadata, org, repo, id, is_private")
    .ilike("org", escapeForIlike(org))
    .ilike("repo", escapeForIlike(repo))
    .single();

  if (!repoData) {
    return null;
  }

  const hasAccess = await canUserAccessRepo(supabase, repoData, user?.id);
  if (!hasAccess) {
    return null;
  }

  const { count: subscriptionCount } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("repo_id", repoData.id);

  const parseResult = metadataSchema.safeParse(repoData.metadata);
  if (!parseResult.success) {
    return null;
  }
  const meta = parseResult.data;

  return {
    org: repoData.org,
    repo: repoData.repo,
    createdAt: new Date(meta.created_at),
    description: meta.description,
    websiteUrl: meta.homepage_url,
    avatarUrl: meta.avatar_url,
    topLanguages: meta.languages,
    license: meta.license,
    id: repoData.id,
    subscriptionCount: subscriptionCount || 0,
    isPrivate: repoData.is_private,
  };
}
