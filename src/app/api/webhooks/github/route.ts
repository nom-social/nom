import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import httpStatus from "http-status";
import crypto from "crypto";
import * as Sentry from "@sentry/nextjs";

import { createClient } from "@/utils/supabase/server";
import { Json, TablesInsert } from "@/types/supabase";
import { processGithubEvents } from "@/trigger/process-github-events";
import { syncBatchReposMetadataTask } from "@/trigger/sync-batch-repos-metadata";

import * as schemas from "./schemas";
import { createNewRepo } from "./route/utils";

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    // Get the raw request body
    const rawBody = await request.json();
    const eventType = request.headers.get("x-github-event");

    // Validate the request body with Zod
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
        { status: httpStatus.BAD_REQUEST }
      );

    const payload = validationResult.data;

    if (payload.event_type === "installation") {
      if (payload.action === "created") {
        await createNewRepo({
          supabase,
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
        supabase,
        repos: payload.repositories_added.map(({ full_name }) => {
          const [org, repo] = full_name.split("/");
          return { org, repo };
        }),
        senderLogin: payload.sender.login,
        installationId: payload.installation?.id, // Pass installationId
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

    // Skip database operations for comments
    if (payload.event_type === "issue_comment")
      return NextResponse.json({
        message: "Comment event, ignoring webhook",
        timestamp: new Date().toISOString(),
      });

    // Skip database operations for ping events
    if (payload.event_type === "ping")
      return NextResponse.json({
        message: "Ping received successfully",
        timestamp: new Date().toISOString(),
      });

    const { data: repoData } = await supabase
      .from("repositories")
      .select("id")
      .eq("org", org)
      .eq("repo", repo)
      .single();

    if (!repoData) {
      return NextResponse.json({
        message: "Repository not found, ignoring webhook",
        timestamp: new Date().toISOString(),
      });
    }

    // Secret validation for GitHub webhook
    const signature = request.headers.get("x-hub-signature-256");
    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: httpStatus.UNAUTHORIZED }
      );
    }
    // Reconstruct the raw body for HMAC validation
    const rawBodyString = JSON.stringify(rawBody);
    const hmac = crypto.createHmac(
      "sha256",
      process.env.GITHUB_WEBHOOK_SECRET!
    );
    hmac.update(rawBodyString);
    const digest = `sha256=${hmac.digest("hex")}`;
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: httpStatus.UNAUTHORIZED }
      );
    }

    const eventData: TablesInsert<"github_event_log"> = {
      event_type: payload.event_type,
      action: payload.action || null,
      org: payload.organization?.login || payload.repository.owner.login,
      repo: payload.repository.name,
      raw_payload: { event_type: eventType, ...rawBody } as Json,
    };

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
      // Check if user exists in Supabase auth
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("github_username", actorLogin)
        .single();

      if (user && payload.action === "created")
        await supabase
          .from("subscriptions")
          .upsert(
            { user_id: user.id, repo_id: repoData.id },
            { onConflict: "user_id,repo_id" }
          )
          .throwOnError();

      if (user && payload.action === "deleted")
        await supabase
          .from("subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("repo_id", repoData.id)
          .throwOnError();
    }

    // Handle repository edited events
    if (payload.event_type === "repository" && payload.action === "edited") {
      await syncBatchReposMetadataTask.trigger({
        repos: [{ org, repo }],
      });
      return NextResponse.json({
        message: "Repository edited event, triggered metadata sync",
        timestamp: new Date().toISOString(),
      });
    }

    // Store in Supabase
    await supabase.from("github_event_log").insert(eventData).throwOnError();
    await processGithubEvents.trigger();

    // Return a success response
    return NextResponse.json({
      message: "Webhook received and stored successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: httpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
