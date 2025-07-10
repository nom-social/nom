import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";

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
            "Query the feed with optional search filters like org:, repo:, type:, from:, to:, owner: and text search",
          parameters: z.object({
            query: z
              .string()
              .optional()
              .describe(
                "Search query with optional filters like 'org:microsoft type:pr' or just plain text"
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
      // TODO: Move this to a prompt file
      system: `You are a helpful AI assistant for a GitHub activity feed application. You can help users:

1. Search and query their personal feed
2. Search and query the public feed  
3. Search and query specific repository feeds
4. Explain feed items and activity
5. Help with filtering using special syntax:
   - org:name - filter by organization
   - repo:name - filter by repository
   - type:pr|issue|commit - filter by activity type
   - from:date - filter items from date
   - to:date - filter items to date
   - owner:name - filter by owner (same as org:)

Current user: ${user.email || user.id}
Current date time: ${new Date().toLocaleString()}

When using tools:
- Use queryFeed for all feed queries
- Always provide helpful explanations of the results
- Format feed items in a readable way with links when possible
- When showing feed items, include relevant details like title, type, updated_at, and repository info

Be concise but helpful. If a query fails, suggest alternative approaches.`,
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
