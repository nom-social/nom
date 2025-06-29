import { cookies } from "next/headers";
import { z } from "zod";

import { createClient } from "@/utils/supabase/server";

const metadataSchema = z.object({
  avatar_url: z.string().url(),
  description: z.string(),
  created_at: z.string(),
  languages: z.array(
    z.object({
      name: z.string(),
      color: z.string().nullable(),
      bytes: z.number(),
    })
  ),
  homepage_url: z.string().url(),
  license: z.string(),
});

export async function fetchRepoProfile(org: string, repo: string) {
  const supabase = createClient(cookies());
  const { data } = await supabase
    .from("repositories")
    .select("metadata, org, repo")
    .eq("org", org)
    .eq("repo", repo)
    .single();

  if (!data) {
    return null;
  }

  const parseResult = metadataSchema.safeParse(data.metadata);
  if (!parseResult.success) {
    return null;
  }
  const meta = parseResult.data;

  return {
    org: data.org,
    repo: data.repo,
    createdAt: new Date(meta.created_at),
    description: meta.description,
    websiteUrl: meta.homepage_url,
    avatarUrl: meta.avatar_url,
    topLanguages: meta.languages,
    license: meta.license,
  };
}
