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
    .from("public_repository_data")
    .select("metadata, org, repo, id")
    .eq("org", org)
    .eq("repo", repo)
    .single();

  const { count: subscriptionCount } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("repo_id", data?.id || "");

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
    id: data.id,
    subscriptionCount: subscriptionCount || 0,
  };
}

export async function createSubscription(org: string, repo: string) {
  "use server";
  const supabase = createClient(cookies());
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    return { success: false, error: "Not authenticated" };
  }
  const userId = session.user.id;

  // Get repo id from org/repo
  const { data: repoData } = await supabase
    .from("public_repository_data")
    .select("id")
    .eq("org", org)
    .eq("repo", repo)
    .single()
    .throwOnError();

  // Upsert subscription
  await supabase
    .from("subscriptions")
    .insert({
      user_id: userId,
      repo_id: repoData.id,
    })
    .throwOnError();
}

export async function removeSubscription(org: string, repo: string) {
  "use server";
  const supabase = createClient(cookies());
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    return { success: false, error: "Not authenticated" };
  }
  const userId = session.user.id;

  // Get repo id from org/repo
  const { data: repoData } = await supabase
    .from("public_repository_data")
    .select("id")
    .eq("org", org)
    .eq("repo", repo)
    .single()
    .throwOnError();

  // Delete subscription
  await supabase
    .from("subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("repo_id", repoData.id)
    .throwOnError();
}

export async function isSubscribed(org: string, repo: string) {
  const supabase = createClient(cookies());
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    return { subscribed: false, error: "Not authenticated" };
  }
  const userId = session.user.id;

  // Get repo id from org/repo
  const { data: repoData } = await supabase
    .from("public_repository_data")
    .select("id")
    .eq("org", org)
    .eq("repo", repo)
    .single()
    .throwOnError();

  // Check subscription
  const { data: subData } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("repo_id", repoData.id)
    .maybeSingle();

  return { subscribed: !!subData };
}
