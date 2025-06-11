import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";

import { createClient } from "@/utils/supabase/server";
import { Json } from "@/types/supabase";

import * as schemas from "./schemas";

function extractEventData(
  eventType: string,
  payload: schemas.GitHubWebhookPayload,
  rawBody: unknown
) {
  const baseData = {
    event_type: eventType,
    action: payload.action || null,
    actor_login: payload.sender?.login || payload.actor?.login || "unknown",
    org:
      payload.organization?.login ||
      payload.repository?.owner?.login ||
      "unknown",
    repo: payload.repository?.name || "unknown",
    resource_id: "unknown", // Will be set based on event type
    resource_type: eventType.split("_")[0],
    metadata: {} as Json,
    raw_payload: rawBody as unknown as Json,
  };

  // Extract specific metadata based on event type
  switch (eventType) {
    case "pull_request": {
      const prPayload = payload as z.infer<
        typeof schemas.pullRequestWebhookSchema
      > & {
        event_type: "pull_request";
      };
      baseData.resource_id = prPayload.pull_request.id.toString();
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
      baseData.resource_id = reviewPayload.review?.id.toString() || "unknown";
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
      baseData.resource_id = issuePayload.issue.id.toString();
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
      baseData.resource_id = releasePayload.release.id.toString();
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
      baseData.resource_id = commentPayload.comment.id.toString();
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
      baseData.resource_id = pushPayload.commits[0]?.sha || "unknown";
      baseData.metadata = {
        ref: pushPayload.ref,
        commits: pushPayload.commits.map((c) => ({
          sha: c.sha,
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
        { status: 400 }
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
        { status: 400 }
      );
    }

    const payload = validationResult.data;

    // Extract event data
    const eventData = extractEventData(eventType, payload, rawBody);

    // Store in Supabase
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase.from("github_event_log").insert(eventData);

    if (error) {
      console.error("Error storing GitHub event:", error);
      return NextResponse.json(
        { error: "Failed to store event" },
        { status: 500 }
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
      { status: 500 }
    );
  }
}
