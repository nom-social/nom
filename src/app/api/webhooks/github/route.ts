import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import httpStatus from "http-status";

import { createClient } from "@/utils/supabase/server";
import { Json, TablesInsert } from "@/types/supabase";

import * as schemas from "./schemas";

function extractEventData(
  payload: schemas.GitHubWebhookPayload,
  rawBody: unknown
): TablesInsert<"github_event_log"> {
  const baseData: TablesInsert<"github_event_log"> = {
    event_type: payload.event_type,
    action: payload.action || null,
    actor_login: payload.sender?.login || payload.actor?.login || "unknown",
    org:
      payload.organization?.login ||
      payload.repository?.owner?.login ||
      "unknown",
    repo: payload.repository?.name || "unknown",
    metadata: {},
    raw_payload: rawBody as Json,
  };

  if (payload.event_type === "ping") {
    return baseData;
  }

  if (payload.event_type === "pull_request") {
    baseData.metadata = {
      title: payload.pull_request.title,
      state: payload.pull_request.state,
      merged: payload.pull_request.merged,
      review_state: payload.review?.state,
      requested_reviewers: payload.pull_request.requested_reviewers.map(
        (r) => r.login
      ),
    };
    return baseData;
  }

  if (payload.event_type === "pull_request_review") {
    baseData.metadata = {
      state: payload.review?.state,
      body: payload.review?.body,
      commit_id: payload.review?.commit_id,
    };
    return baseData;
  }

  if (payload.event_type === "issues") {
    baseData.metadata = {
      title: payload.issue.title,
      state: payload.issue.state,
      labels: payload.issue.labels.map((l) => l.name),
      assignees: payload.issue.assignees.map((a) => a.login),
    };
    return baseData;
  }

  if (payload.event_type === "release") {
    baseData.metadata = {
      tag_name: payload.release.tag_name,
      name: payload.release.name,
      body: payload.release.body,
      prerelease: payload.release.prerelease,
    };
    return baseData;
  }

  if (
    payload.event_type === "issue_comment" ||
    payload.event_type === "pull_request_review_comment"
  ) {
    baseData.metadata = {
      body: payload.comment.body,
      in_reply_to_id: payload.comment.in_reply_to_id,
    };
    return baseData;
  }

  if (payload.event_type === "push") {
    baseData.metadata = {
      ref: payload.ref,
      commits: payload.commits.map((c) => ({
        id: c.id,
        message: c.message,
        author: c.author,
      })),
    };
    return baseData;
  }

  if (payload.event_type === "status") {
    baseData.metadata = {
      state: payload.state,
      context: payload.context,
      description: payload.description,
      target_url: payload.target_url,
    };
    return baseData;
  }

  if (payload.event_type === "create" || payload.event_type === "delete") {
    baseData.metadata = {
      ref: payload.ref,
      ref_type: payload.ref_type,
      master_branch: payload.master_branch,
      description: payload.description,
      pusher_type: payload.pusher_type,
    };
    return baseData;
  }

  return baseData;
}

export async function POST(request: Request) {
  try {
    // Get the raw request body
    const rawBody = await request.json();

    // Get the event type from headers
    const eventType = request.headers.get("x-github-event");
    if (!eventType) {
      return NextResponse.json(
        { error: "Missing GitHub event type" },
        { status: httpStatus.BAD_REQUEST }
      );
    }

    // Validate the request body with Zod
    const validationResult = schemas.githubWebhookPayloadSchema.safeParse({
      event_type: eventType,
      ...rawBody,
    });

    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error);
      return NextResponse.json(
        {
          error: "Invalid webhook payload",
          details: validationResult.error.format(),
        },
        { status: httpStatus.BAD_REQUEST }
      );
    }

    const payload = validationResult.data;
    const org =
      payload.organization?.login ||
      payload.repository?.owner?.login ||
      "unknown";
    const repo = payload.repository?.name || "unknown";

    // Skip database operations for ping events
    if (eventType === "ping") {
      return NextResponse.json({
        message: "Ping received successfully",
        timestamp: new Date().toISOString(),
      });
    }

    // Check if org/repo combination exists in database
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { data: repoData } = await supabase
      .from("repositories")
      .select("id")
      .eq("org", org)
      .eq("repo", repo)
      .single();

    if (!repoData) {
      return NextResponse.json({
        message: "Repository not tracked, ignoring webhook",
        timestamp: new Date().toISOString(),
      });
    }

    // Extract event data
    const eventData = extractEventData(payload, rawBody);

    // Store in Supabase
    await supabase.from("github_event_log").insert(eventData).throwOnError();

    // Handle star events
    if (eventType === "star") {
      const actorLogin = payload.sender?.login || payload.actor?.login;
      if (!actorLogin) {
        console.error("Missing actor login for star event");
        return NextResponse.json(
          { error: "Missing actor login" },
          { status: httpStatus.BAD_REQUEST }
        );
      }

      // Check if user exists in Supabase auth
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("github_user_name", actorLogin)
        .single();

      if (!user) {
        return NextResponse.json({
          message: "User not found, ignoring event",
          timestamp: new Date().toISOString(),
        });
      }

      const isAdd = payload.action === "created";

      if (isAdd) {
        // Add subscription
        await supabase
          .from("subscriptions")
          .upsert(
            { user_id: user.id, repo_id: repoData.id },
            { onConflict: "user_id,repo_id" }
          )
          .throwOnError();
      } else {
        // Remove subscription
        await supabase
          .from("subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("repo_id", repoData.id)
          .throwOnError();
      }
    }

    // Return a success response
    return NextResponse.json({
      message: "Webhook received and stored successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error processing GitHub webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: httpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
