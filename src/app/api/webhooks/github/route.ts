import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import httpStatus from "http-status";

import { createClient } from "@/utils/supabase/server";
import { Json, TablesInsert } from "@/types/supabase";

import * as schemas from "./schemas";

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    // Get the raw request body
    const rawBody = await request.json();

    // Validate the request body with Zod
    const validationResult = schemas.githubWebhookPayloadSchema.safeParse({
      event_type: request.headers.get("x-github-event"),
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
    if (payload.event_type === "ping") {
      return NextResponse.json({
        message: "Ping received successfully",
        timestamp: new Date().toISOString(),
      });
    }

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

    const eventData: TablesInsert<"github_event_log"> = {
      event_type: payload.event_type,
      action: payload.action || null,
      org:
        payload.organization.login ||
        payload.repository.owner.login ||
        "unknown",
      repo: payload.repository.name,
      raw_payload: rawBody as Json,
    };

    // Store in Supabase
    await supabase.from("github_event_log").insert(eventData).throwOnError();

    // Handle star events
    if (payload.event_type === "star") {
      const actorLogin = payload.sender.login;
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

      if (payload.action === "created")
        await supabase
          .from("subscriptions")
          .upsert(
            { user_id: user.id, repo_id: repoData.id },
            { onConflict: "user_id,repo_id" }
          )
          .throwOnError();
      if (payload.action === "deleted")
        await supabase
          .from("subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("repo_id", repoData.id)
          .throwOnError();
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
