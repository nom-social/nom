import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import httpStatus from "http-status";
import crypto from "crypto";

import { createClient } from "@/utils/supabase/server";
import { Json, TablesInsert } from "@/types/supabase";
import { processGithubEvents } from "@/trigger/process-github-events";

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

    const org =
      payload.organization?.login ||
      payload.repository?.owner?.login ||
      "unknown";
    const repo = payload.repository?.name || "unknown";

    // Skip database operations for bot comments
    if (payload.event_type === "issue_comment" && payload.sender.type === "Bot")
      return NextResponse.json({
        message: "Bot comment, ignoring webhook",
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
      .select("id, repositories_secure ( secret )")
      .eq("org", org)
      .eq("repo", repo)
      .single();

    let finalRepoData = repoData;
    if (!repoData) {
      // Create the repository and repositories_secure entries
      finalRepoData = await createNewRepo({ supabase, org, repo });
    }

    if (!finalRepoData?.repositories_secure?.secret)
      return NextResponse.json({
        message: "Repository not tracked, ignoring webhook",
        timestamp: new Date().toISOString(),
      });

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
      finalRepoData.repositories_secure.secret
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
      org:
        payload.organization.login ||
        payload.repository.owner.login ||
        "unknown",
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
            { user_id: user.id, repo_id: finalRepoData.id },
            { onConflict: "user_id,repo_id" }
          )
          .throwOnError();

      if (user && payload.action === "deleted")
        await supabase
          .from("subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("repo_id", finalRepoData.id)
          .throwOnError();
    }

    // Store in Supabase
    await supabase.from("github_event_log").insert(eventData).throwOnError();
    await processGithubEvents.trigger();

    // Return a success response
    return NextResponse.json({
      message: "Webhook received and stored successfully",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: httpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
