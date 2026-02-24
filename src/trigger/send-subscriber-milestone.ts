import { schemaTask } from "@trigger.dev/sdk";
import { escapeAttribute, escapeText } from "entities";
import { z } from "zod";

import { BASE_URL } from "@/lib/constants";
import * as supabase from "@/utils/supabase/admin";
import * as resend from "@/utils/resend/client";

const MILESTONES = [1, 10, 25, 50, 100, 1000];

export const sendSubscriberMilestoneTask = schemaTask({
  id: "send-subscriber-milestone",
  queue: { name: "send-subscriber-milestone", concurrencyLimit: 1 },
  schema: z.object({
    repo_id: z.string(),
  }),
  retry: { maxAttempts: 1 },
  run: async ({ repo_id }) => {
    const supabaseClient = supabase.createAdminClient();
    const resendClient = resend.createClient();

    const { count: subscriberCount } = await supabaseClient
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("repo_id", repo_id)
      .throwOnError();

    const count = subscriberCount ?? 0;
    if (count === 0) return;

    const { data: existingNotifications } = await supabaseClient
      .from("notifications")
      .select("key")
      .eq("type", "subscriber_milestone")
      .eq("entity_id", repo_id)
      .in("key", MILESTONES.map(String))
      .throwOnError();

    const alreadySent = new Set(
      (existingNotifications ?? []).map((n) => n.key)
    );
    const newlyCrossed = MILESTONES.filter(
      (m) => count >= m && !alreadySent.has(String(m))
    );
    const milestoneToSend =
      newlyCrossed.length > 0 ? Math.max(...newlyCrossed) : null;
    if (milestoneToSend === null) return;

    const { data: repo } = await supabaseClient
      .from("repositories")
      .select("org, repo")
      .eq("id", repo_id)
      .single()
      .throwOnError();

    if (!repo) return;

    const { data: repoUsers } = await supabaseClient
      .from("repositories_users")
      .select("user_id")
      .eq("repo_id", repo_id)
      .throwOnError();

    if (!repoUsers?.length) return;

    const { data: users } = await supabaseClient
      .from("users")
      .select("email")
      .in(
        "id",
        repoUsers.map((r) => r.user_id)
      )
      .throwOnError();

    const emails = (users ?? [])
      .map((u) => u.email)
      .filter((e): e is string => !!e?.trim());

    if (emails.length === 0) return;

    const repoUrl = `${BASE_URL}/${repo.org}/${repo.repo}`;
    const subscriberLabel =
      milestoneToSend === 1 ? "subscriber" : "subscribers";
    const subject = `${repo.org}/${repo.repo}: Your repo reached ${milestoneToSend} ${subscriberLabel}!`;
    const html = `
      <p>Great news! Your repo <strong>${escapeText(repo.org)}/${escapeText(repo.repo)}</strong> has reached <strong>${milestoneToSend}</strong> ${subscriberLabel}.</p>
      <p><a href="${escapeAttribute(repoUrl)}">View on Nom</a></p>
    `;

    await Promise.allSettled(
      emails.map((to) => {
        return resendClient.emails.send({
          from: "Nom <notifications@nomit.dev>",
          to,
          subject,
          html,
        });
      })
    );

    await supabaseClient
      .from("notifications")
      .insert({
        type: "subscriber_milestone",
        entity_id: repo_id,
        key: String(milestoneToSend),
      })
      .throwOnError();
  },
});
