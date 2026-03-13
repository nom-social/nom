import { schemaTask } from "@trigger.dev/sdk";
import { escapeAttribute, escapeText } from "entities";
import { z } from "zod";

import { BASE_URL } from "@/lib/constants";
import { createAdminConvexClient } from "@/utils/convex/client";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import * as resend from "@/utils/resend/client";

const MILESTONES = [1, 10, 25, 50, 100, 1000];

export const sendSubscriberMilestoneTask = schemaTask({
  id: "send-subscriber-milestone",
  queue: { name: "send-subscriber-milestone", concurrencyLimit: 1 },
  schema: z.object({ repo_id: z.string() }),
  retry: { maxAttempts: 1 },
  run: async ({ repo_id }) => {
    const convex = createAdminConvexClient();
    const resendClient = resend.createClient();
    const repositoryId = repo_id as Id<"repositories">;

    const count = await convex.query(api.admin.getSubscriberCount, {
      repositoryId,
    });
    if (count === 0) return;

    const existingNotifications = await convex.query(
      api.admin.getNotifications,
      {
        type: "subscriber_milestone",
        entityId: repo_id,
        keys: MILESTONES.map(String),
      },
    );

    const alreadySent = new Set(existingNotifications.map((n: { key: string }) => n.key));
    const newlyCrossed = MILESTONES.filter(
      (m) => count >= m && !alreadySent.has(String(m)),
    );
    const milestoneToSend =
      newlyCrossed.length > 0 ? Math.max(...newlyCrossed) : null;
    if (milestoneToSend === null) return;

    // Get repo by ID using repositoriesByIds
    const [repoDoc] = await convex.query(api.admin.getRepositoriesByIds, {
      repositoryIds: [repositoryId],
    });
    if (!repoDoc) return;

    const repoUsers = await convex.query(api.admin.getRepositoryUsers, {
      repositoryId,
    });
    if (!repoUsers.length) return;

    const users = await convex.query(api.admin.getUsersByIds, {
      userIds: repoUsers.map((r: { userId: string }) => r.userId),
    });

    const emails = users
      .map((u: { email?: string | null } | null) => u?.email)
      .filter((e: string | null | undefined): e is string => !!e?.trim());

    if (emails.length === 0) return;

    const repoUrl = `${BASE_URL}/${repoDoc.org}/${repoDoc.repo}`;
    const subscriberLabel =
      milestoneToSend === 1 ? "subscriber" : "subscribers";
    const subject = `${repoDoc.org}/${repoDoc.repo}: Your repo reached ${milestoneToSend} ${subscriberLabel}!`;
    const html = `
      <p>Great news! Your repo <strong>${escapeText(repoDoc.org)}/${escapeText(repoDoc.repo)}</strong> has reached <strong>${milestoneToSend}</strong> ${subscriberLabel}.</p>
      <p><a href="${escapeAttribute(repoUrl)}">View on Nom</a></p>
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
      type: "subscriber_milestone",
      entityId: repo_id,
      key: String(milestoneToSend),
    });
  },
});
