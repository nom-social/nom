import { schemaTask } from "@trigger.dev/sdk";
import { escapeAttribute, escapeText } from "entities";
import { z } from "zod";

import { BASE_URL } from "@/lib/constants";
import { createAdminConvexClient } from "@/utils/convex/client";
import { api } from "@/../convex/_generated/api";
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
  schema: z.object({ dedupe_hash: z.string() }),
  retry: { maxAttempts: 1 },
  run: async ({ dedupe_hash }) => {
    const convex = createAdminConvexClient();
    const resendClient = resend.createClient();

    const likeCount = await convex.query(api.admin.getLikeCount, {
      dedupeHash: dedupe_hash,
    });
    if (likeCount === 0) return;

    const existingNotifications = await convex.query(
      api.admin.getNotifications,
      {
        type: "engagement_milestone",
        entityId: dedupe_hash,
        keys: MILESTONES.map(String),
      },
    );

    const alreadySent = new Set(existingNotifications.map((n: { key: string }) => n.key));
    const newlyCrossed = MILESTONES.filter(
      (m) => likeCount >= m && !alreadySent.has(String(m)),
    );
    const milestoneToSend =
      newlyCrossed.length > 0 ? Math.max(...newlyCrossed) : null;
    if (milestoneToSend === null) return;

    const timelineItem = await convex.query(
      api.admin.getPublicTimelineByDedupeHash,
      { dedupeHash: dedupe_hash },
    );
    if (!timelineItem) return;

    const [repoDoc] = await convex.query(api.admin.getRepositoriesByIds, {
      repositoryIds: [timelineItem.repositoryId],
    });
    if (!repoDoc) return;

    const repoUsers = await convex.query(api.admin.getRepositoryUsers, {
      repositoryId: timelineItem.repositoryId,
    });
    if (!repoUsers.length) return;

    const users = await convex.query(api.admin.getUsersByIds, {
      userIds: repoUsers.map((r: { userId: string }) => r.userId),
    });

    const emails = users
      .map((u: { email?: string | null } | null) => u?.email)
      .filter((e: string | null | undefined): e is string => !!e?.trim());

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
    const data = timelineItem.data as Record<string, unknown>;
    if (timelineItem.type === "pull_request") {
      const parsed = prDataSchema.safeParse(data);
      if (parsed.success) itemTitle = parsed.data.pull_request.title;
    } else if (timelineItem.type === "release") {
      const parsed = releaseDataSchema.safeParse(data);
      if (parsed.success)
        itemTitle =
          parsed.data.release.name ?? parsed.data.release.tag_name ?? "Release";
    } else if (timelineItem.type === "push") {
      const parsed = pushDataSchema.safeParse(data);
      if (parsed.success) itemTitle = parsed.data.push.title;
    }

    const statusUrl = `${BASE_URL}/${repoDoc.org}/${repoDoc.repo}/status/${dedupe_hash}`;
    const subject = `${repoDoc.org}/${repoDoc.repo}: Your ${typeLabel} reached ${milestoneToSend} ${milestoneToSend === 1 ? "like" : "likes"}!`;
    const html = `
      <p>Great news! Your ${typeLabel} in <strong>${escapeText(repoDoc.org)}/${escapeText(repoDoc.repo)}</strong> has reached <strong>${milestoneToSend}</strong> ${milestoneToSend === 1 ? "like" : "likes"}.</p>
      <p><strong>${escapeText(itemTitle)}</strong></p>
      <p><a href="${escapeAttribute(statusUrl)}">View on Nom</a></p>
    `;

    await Promise.allSettled(
      emails.map((to: string) =>
        resendClient.emails.send({
          from: "Nom <notifications@nomit.dev>",
          to,
          subject,
          html,
        }),
      ),
    );

    await convex.mutation(api.admin.insertNotification, {
      type: "engagement_milestone",
      entityId: dedupe_hash,
      key: String(milestoneToSend),
    });
  },
});
