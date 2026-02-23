import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

import { BASE_URL } from "@/lib/constants";
import * as supabase from "@/utils/supabase/admin";
import * as resend from "@/utils/resend/client";

const prDataSchema = z.looseObject({
  pull_request: z.looseObject({ title: z.string() }),
});
const releaseDataSchema = z.looseObject({
  release: z.looseObject({ name: z.string().nullable(), tag_name: z.string() }),
});
const pushDataSchema = z.looseObject({
  push: z.looseObject({ title: z.string() }),
});

const MILESTONES = [1, 10, 25, 50, 100, 1000];

export const sendEngagementMilestoneTask = schemaTask({
  id: "send-engagement-milestone",
  queue: { name: "send-engagement-milestone", concurrencyLimit: 1 },
  schema: z.object({
    dedupe_hash: z.string(),
  }),
  retry: { maxAttempts: 1 },
  run: async ({ dedupe_hash }) => {
    const supabaseClient = supabase.createAdminClient();
    const resendClient = resend.createClient();

    const { data: likeData } = await supabaseClient
      .rpc("get_batch_like_data", {
        dedupe_hashes: [dedupe_hash],
      })
      .throwOnError();

    const likeCount = Number(likeData?.[0]?.like_count ?? 0);
    if (likeCount === 0) return;

    const { data: existingNotifications } = await supabaseClient
      .from("notifications")
      .select("key")
      .eq("type", "engagement_milestone")
      .eq("entity_id", dedupe_hash)
      .in("key", MILESTONES.map(String))
      .throwOnError();

    const alreadySent = new Set(
      (existingNotifications ?? []).map((n) => n.key)
    );
    const newlyCrossed = MILESTONES.filter(
      (m) => likeCount >= m && !alreadySent.has(String(m))
    );
    // Send for the highest newly crossed milestone only (e.g. at 11 likes, send for 10)
    const milestoneToSend =
      newlyCrossed.length > 0 ? Math.max(...newlyCrossed) : null;
    if (milestoneToSend === null) return;

    const { data: timelineItem } = await supabaseClient
      .from("public_timeline")
      .select("repo_id, type, data")
      .eq("dedupe_hash", dedupe_hash)
      .single()
      .throwOnError();

    if (!timelineItem) return;

    const { data: repo } = await supabaseClient
      .from("repositories")
      .select("org, repo")
      .eq("id", timelineItem.repo_id)
      .single()
      .throwOnError();

    if (!repo) return;

    const { data: repoUsers } = await supabaseClient
      .from("repositories_users")
      .select("user_id")
      .eq("repo_id", timelineItem.repo_id)
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

    const typeLabel =
      timelineItem.type === "pull_request"
        ? "pull request"
        : timelineItem.type === "release"
          ? "release"
          : timelineItem.type === "push"
            ? "push"
            : "activity";
    let itemTitle = "Your activity";
    if (timelineItem.type === "pull_request") {
      const parsed = prDataSchema.safeParse(timelineItem.data);
      if (parsed.success) itemTitle = parsed.data.pull_request.title;
    } else if (timelineItem.type === "release") {
      const parsed = releaseDataSchema.safeParse(timelineItem.data);
      if (parsed.success)
        itemTitle =
          parsed.data.release.name ?? parsed.data.release.tag_name ?? "Release";
    } else if (timelineItem.type === "push") {
      const parsed = pushDataSchema.safeParse(timelineItem.data);
      if (parsed.success) itemTitle = parsed.data.push.title;
    }

    const statusUrl = `${BASE_URL}/${repo.org}/${repo.repo}/status/${dedupe_hash}`;
    const subject = `${repo.org}/${repo.repo}: Your ${typeLabel} reached ${milestoneToSend} ${milestoneToSend === 1 ? "like" : "likes"}!`;
    const html = `
      <p>Great news! Your ${typeLabel} in <strong>${repo.org}/${repo.repo}</strong> has reached <strong>${milestoneToSend}</strong> ${milestoneToSend === 1 ? "like" : "likes"}.</p>
      <p><strong>${itemTitle}</strong></p>
      <p><a href="${statusUrl}">View on Nom</a></p>
    `;

    await Promise.allSettled(
      emails.map((to) =>
        resendClient.emails.send({
          from: "Nom <notifications@nomit.dev>",
          to,
          subject,
          html,
        })
      )
    );

    await supabaseClient
      .from("notifications")
      .insert({
        type: "engagement_milestone",
        entity_id: dedupe_hash,
        key: String(milestoneToSend),
      })
      .throwOnError();
  },
});
