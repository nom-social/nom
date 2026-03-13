import { NextResponse } from "next/server";
import crypto from "crypto";
import * as Sentry from "@sentry/nextjs";
import { api } from "@/../convex/_generated/api";
import { processGithubEvents } from "@/trigger/process-github-events";
import { syncBatchReposMetadataTask } from "@/trigger/sync-batch-repos-metadata";
import { createAdminConvexClient } from "@/utils/convex/client";

import * as schemas from "./schemas";
import { createNewRepo } from "./route/utils";

export async function POST(request: Request) {
  const convex = createAdminConvexClient();

  try {
    const rawBody = await request.json();
    const eventType = request.headers.get("x-github-event");

    const validationResult = schemas.githubWebhookPayloadSchema.safeParse({
      event_type: eventType,
      ...rawBody,
    });

    if (!validationResult.success)
      return NextResponse.json(
        {
          error: "Invalid webhook payload",
          details: validationResult.error.format(),
        },
        { status: 400 },
      );

    const payload = validationResult.data;

    if (payload.event_type === "installation") {
      if (payload.action === "created") {
        await createNewRepo({
          convex,
          repos: payload.repositories.map(({ full_name }) => {
            const [org, repo] = full_name.split("/");
            return { org, repo };
          }),
          senderLogin: payload.sender.login,
          installationId: payload.installation.id,
        });
        return NextResponse.json({
          message: "Installation event, creating repositories",
          timestamp: new Date().toISOString(),
        });
      }
      return NextResponse.json({
        message: "Installation event, ignoring webhook",
        timestamp: new Date().toISOString(),
      });
    }

    if (payload.event_type === "installation_repositories") {
      await createNewRepo({
        convex,
        repos: payload.repositories_added.map(({ full_name }) => {
          const [org, repo] = full_name.split("/");
          return { org, repo };
        }),
        senderLogin: payload.sender.login,
        installationId: payload.installation.id,
      });
      return NextResponse.json({
        message: "Installation repositories event, creating repositories",
        timestamp: new Date().toISOString(),
      });
    }

    const org =
      payload.organization?.login ||
      payload.repository?.owner?.login ||
      "unknown";
    const repo = payload.repository?.name || "unknown";

    if (payload.event_type === "ping")
      return NextResponse.json({
        message: "Ping received successfully",
        timestamp: new Date().toISOString(),
      });

    const repoDoc = await convex.query(api.admin.getRepository, { org, repo });
    if (!repoDoc) {
      return NextResponse.json({
        message: "Repository not found, ignoring webhook",
        timestamp: new Date().toISOString(),
      });
    }

    // HMAC validation
    const signature = request.headers.get("x-hub-signature-256");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }
    const rawBodyString = JSON.stringify(rawBody);
    const hmac = crypto.createHmac(
      "sha256",
      process.env.GITHUB_WEBHOOK_SECRET!,
    );
    hmac.update(rawBodyString);
    const digest = `sha256=${hmac.digest("hex")}`;
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Only store push events to the default branch
    if (payload.event_type === "push") {
      const pushedBranch = payload.ref.replace("refs/heads/", "");
      const defaultBranch = payload.repository.default_branch;
      if (pushedBranch !== defaultBranch) {
        return NextResponse.json({
          message: `Push event to non-default branch (${pushedBranch}), ignoring webhook`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Handle star events
    if (payload.event_type === "star") {
      const actorLogin = payload.sender.login;
      const user = await convex.query(api.admin.getUserByGithubUsername, {
        githubUsername: actorLogin,
      });

      if (user && payload.action === "created") {
        await convex.mutation(api.admin.upsertSubscription, {
          userId: user._id,
          repositoryId: repoDoc._id,
        });
      }
      if (user && payload.action === "deleted") {
        await convex.mutation(api.admin.deleteSubscription, {
          userId: user._id,
          repositoryId: repoDoc._id,
        });
      }
    }

    // Handle repository edited events
    if (payload.event_type === "repository" && payload.action === "edited") {
      await syncBatchReposMetadataTask.trigger({ repos: [{ org, repo }] });
      return NextResponse.json({
        message: "Repository edited event, triggered metadata sync",
        timestamp: new Date().toISOString(),
      });
    }

    // Store event and trigger processing
    await convex.mutation(api.admin.insertGithubEvent, {
      eventType: payload.event_type,
      action: payload.action ?? undefined,
      org,
      repo,
      rawPayload: { event_type: eventType, ...rawBody },
    });

    await processGithubEvents.trigger(
      { org, repo },
      { concurrencyKey: `${org}/${repo}` },
    );

    return NextResponse.json({
      message: "Webhook received and stored successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 },
    );
  }
}
