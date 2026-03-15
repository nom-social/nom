import { subMonths } from "date-fns";

import { escapeForIlike } from "@/lib/repo-utils";
import { createClient } from "@/utils/supabase/client";
import type { Tables } from "@/types/supabase";


export class NotAuthenticatedError extends Error {
  constructor() {
    super("Not authenticated");
  }
}

export async function createSubscription(org: string, repo: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new NotAuthenticatedError();

  const userId = user.id;

  // Get repo id from org/repo
  const { data: repoData } = await supabase
    .from("repositories")
    .select("id")
    .ilike("org", escapeForIlike(org))
    .ilike("repo", escapeForIlike(repo))
    .single()
    .throwOnError();

  await supabase
    .from("subscriptions")
    .insert({ user_id: userId, repo_id: repoData.id })
    .throwOnError();

  // Fire and forget — avoid server action to prevent Next.js router.refresh()
  fetch("/api/subscriber-milestone", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo_id: repoData.id }),
  }).catch(() => {});

  // Copy last month's public_timeline events to user_timeline
  const oneMonthAgo = subMonths(new Date(), 1);

  const { data: publicEvents } = await supabase
    .from("public_timeline")
    .select("*")
    .eq("repo_id", repoData.id)
    .gte("created_at", oneMonthAgo.toISOString())
    .throwOnError();

  if (publicEvents && publicEvents.length > 0) {
    const userTimelineEntries = publicEvents.map(
      (event: Tables<"public_timeline">) => ({
        user_id: userId,
        created_at: event.created_at,
        data: event.data,
        dedupe_hash: event.dedupe_hash,
        event_ids: event.event_ids,
        repo_id: event.repo_id,
        score: event.score,
        type: event.type,
        updated_at: new Date().toISOString(),
      }),
    );

    await supabase
      .from("user_timeline")
      .upsert(userTimelineEntries, { onConflict: "user_id,dedupe_hash" })
      .throwOnError();
  }
}

export async function removeSubscription(org: string, repo: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new NotAuthenticatedError();

  const userId = user.id;

  // Get repo id from org/repo
  const { data: repoData } = await supabase
    .from("repositories")
    .select("id")
    .ilike("org", escapeForIlike(org))
    .ilike("repo", escapeForIlike(repo))
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
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { subscribed: false };
  }
  const userId = user.id;

  // Get repo id from org/repo
  const { data: repoData } = await supabase
    .from("repositories")
    .select("id")
    .ilike("org", escapeForIlike(org))
    .ilike("repo", escapeForIlike(repo))
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
