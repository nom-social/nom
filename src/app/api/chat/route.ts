import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";

import { SYSTEM_PROMPT } from "./prompts";

export const runtime = "edge";

class NotAuthenticatedError extends Error {
  constructor() {
    super("User is not authenticated");
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(cookies());

    const { messages } = await req.json();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new NotAuthenticatedError();

    const result = streamText({
      model: openai("gpt-4o-mini"),
      messages,
      tools: {
        queryFeed: {
          description:
            "Query the feed with optional search filters like " +
            "org:, repo:, type:, from:, to:, owner: and text search",
          parameters: z.object({
            query: z
              .string()
              .optional()
              .describe(
                "Search query with optional filters like " +
                  "'org:microsoft type:pr' or just plain text"
              ),
            limit: z
              .number()
              .optional()
              .default(10)
              .describe("Number of items to fetch (default 10)"),
            offset: z
              .number()
              .optional()
              .default(0)
              .describe("Number of items to skip (default 0)"),
          }),
        },
      },
      system: SYSTEM_PROMPT.replace("{user}", user.email || user.id).replace(
        "{date}",
        new Date().toLocaleString()
      ),
    });

    return result.toDataStreamResponse();
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
