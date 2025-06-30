import { createClient } from "@/utils/supabase/client";

export class NotAuthenticatedError extends Error {
  constructor() {
    super("Not authenticated");
  }
}

export async function createSubscription(org: string, repo: string) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) throw new NotAuthenticatedError();

  const userId = session.user.id;

  // Get repo id from org/repo
  const { data: repoData } = await supabase
    .from("public_repository_data")
    .select("id")
    .eq("org", org)
    .eq("repo", repo)
    .single()
    .throwOnError();

  await supabase
    .from("subscriptions")
    .insert({ user_id: userId, repo_id: repoData.id })
    .throwOnError();
}

export async function removeSubscription(org: string, repo: string) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new NotAuthenticatedError();

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
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    return { subscribed: false };
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

isSubscribed.key =
  "src/components/[org]/[repo]/repo-profile-card/actions/isSubscribed";
