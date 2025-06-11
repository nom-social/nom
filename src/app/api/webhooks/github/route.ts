import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import httpStatus from "http-status";

import { createClient } from "@/utils/supabase/server";
import { Json, TablesInsert } from "@/types/supabase";

import * as schemas from "./schemas";

function extractEventData(
  eventType: string,
  payload: schemas.GitHubWebhookPayload,
  rawBody: unknown
) {
  const baseData: TablesInsert<"github_event_log"> = {
    event_type: eventType,
    action: payload.action || null,
    actor_login: payload.sender?.login || payload.actor?.login || "unknown",
    org:
      payload.organization?.login ||
      payload.repository?.owner?.login ||
      "unknown",
    repo: payload.repository?.name || "unknown",
    metadata: {} as Json,
    raw_payload: rawBody as unknown as Json,
  };

  // Extract specific metadata based on event type
  switch (eventType) {
    case "ping": {
      break;
    }
    case "pull_request": {
      const prPayload = payload as z.infer<
        typeof schemas.pullRequestWebhookSchema
      > & {
        event_type: "pull_request";
      };
      baseData.metadata = {
        title: prPayload.pull_request.title,
        state: prPayload.pull_request.state,
        merged: prPayload.pull_request.merged,
        review_state: prPayload.review?.state,
        requested_reviewers: prPayload.pull_request.requested_reviewers.map(
          (r) => r.login
        ),
      } as Json;
      break;
    }
    case "pull_request_review": {
      const reviewPayload = payload as z.infer<
        typeof schemas.pullRequestWebhookSchema
      > & { event_type: "pull_request_review" };
      baseData.metadata = {
        state: reviewPayload.review?.state,
        body: reviewPayload.review?.body,
        commit_id: reviewPayload.review?.commit_id,
      } as Json;
      break;
    }
    case "issues": {
      const issuePayload = payload as z.infer<
        typeof schemas.issueWebhookSchema
      > & {
        event_type: "issues";
      };
      baseData.metadata = {
        title: issuePayload.issue.title,
        state: issuePayload.issue.state,
        labels: issuePayload.issue.labels.map((l) => l.name),
        assignees: issuePayload.issue.assignees.map((a) => a.login),
      } as Json;
      break;
    }
    case "release": {
      const releasePayload = payload as z.infer<
        typeof schemas.releaseWebhookSchema
      > & {
        event_type: "release";
      };
      baseData.metadata = {
        tag_name: releasePayload.release.tag_name,
        name: releasePayload.release.name,
        body: releasePayload.release.body,
        prerelease: releasePayload.release.prerelease,
      } as Json;
      break;
    }
    case "issue_comment":
    case "pull_request_review_comment": {
      const commentPayload = payload as z.infer<
        typeof schemas.commentWebhookSchema
      > & {
        event_type: "issue_comment" | "pull_request_review_comment";
      };
      baseData.metadata = {
        body: commentPayload.comment.body,
        in_reply_to_id: commentPayload.comment.in_reply_to_id,
      } as Json;
      break;
    }
    case "push": {
      const pushPayload = payload as z.infer<
        typeof schemas.pushWebhookSchema
      > & {
        event_type: "push";
      };
      baseData.metadata = {
        ref: pushPayload.ref,
        commits: pushPayload.commits.map((c) => ({
          id: c.id,
          message: c.message,
          author: c.author,
        })),
      } as Json;
      break;
    }
    case "status": {
      const statusPayload = payload as z.infer<
        typeof schemas.statusWebhookSchema
      > & {
        event_type: "status";
      };
      baseData.metadata = {
        state: statusPayload.state,
        context: statusPayload.context,
        description: statusPayload.description,
        target_url: statusPayload.target_url,
      } as Json;
      break;
    }
    case "create":
    case "delete": {
      const branchPayload = payload as z.infer<
        typeof schemas.githubBranchSchema
      > & {
        event_type: "create" | "delete";
      };
      baseData.metadata = {
        ref: branchPayload.ref,
        ref_type: branchPayload.ref_type,
        master_branch: branchPayload.master_branch,
        description: branchPayload.description,
        pusher_type: branchPayload.pusher_type,
      } as Json;
      break;
    }
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

    const { data: repoData, error: repoError } = await supabase
      .from("repositories")
      .select("id")
      .eq("org", org)
      .eq("repo", repo)
      .single();

    if (repoError || !repoData) {
      console.log(`Ignoring webhook for unknown repository: ${org}/${repo}`);
      return NextResponse.json({
        message: "Repository not tracked, ignoring webhook",
        timestamp: new Date().toISOString(),
      });
    }

    // Extract event data
    const eventData = extractEventData(eventType, payload, rawBody);

    // Store in Supabase
    const { error } = await supabase.from("github_event_log").insert(eventData);

    if (error) {
      console.error("Error storing GitHub event:", error);
      return NextResponse.json(
        { error: "Failed to store event" },
        { status: httpStatus.INTERNAL_SERVER_ERROR }
      );
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
