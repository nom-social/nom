import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/client";
import { fetchFeed, fetchPublicFeed } from "@/app/page/feed/actions";
import { fetchFeedPage } from "@/app/[org]/[repo]/page/feed/actions";

export const maxDuration = 30;

// Helper function to get repository ID from org/repo
async function getRepoId(org: string, repo: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("repositories")
    .select("id")
    .eq("org", org)
    .eq("repo", repo)
    .single();
  
  return data?.id || null;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    const result = await streamText({
      model: openai("gpt-4o"),
      messages,
      tools: {
        queryFeed: tool({
          description: "Query the user's personal feed with optional search filters like org:, repo:, type:, from:, to:, owner: and text search",
          parameters: z.object({
            query: z.string().optional().describe("Search query with optional filters like 'org:microsoft type:pr' or just plain text"),
            limit: z.number().optional().default(10).describe("Number of items to fetch (default 10)"),
            offset: z.number().optional().default(0).describe("Number of items to skip (default 0)"),
          }),
          execute: async ({ query, limit = 10, offset = 0 }) => {
            try {
              const result = await fetchFeed({
                query,
                limit,
                offset,
              });
              return {
                success: true,
                data: result,
                message: `Found ${result.items.length} items in your personal feed${query ? ` for query: "${query}"` : ""}`,
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to fetch personal feed",
              };
            }
          },
        }),
        queryPublicFeed: tool({
          description: "Query the public feed with optional search filters like org:, repo:, type:, from:, to:, owner: and text search",
          parameters: z.object({
            query: z.string().optional().describe("Search query with optional filters like 'org:microsoft type:pr' or just plain text"),
            limit: z.number().optional().default(10).describe("Number of items to fetch (default 10)"),
            offset: z.number().optional().default(0).describe("Number of items to skip (default 0)"),
          }),
          execute: async ({ query, limit = 10, offset = 0 }) => {
            try {
              const result = await fetchPublicFeed({
                query,
                limit,
                offset,
              });
              return {
                success: true,
                data: result,
                message: `Found ${result.items.length} items in the public feed${query ? ` for query: "${query}"` : ""}`,
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to fetch public feed",
              };
            }
          },
        }),
        queryRepoFeed: tool({
          description: "Query a specific repository's feed with optional search filters",
          parameters: z.object({
            org: z.string().describe("Organization name"),
            repo: z.string().describe("Repository name"),
            query: z.string().optional().describe("Search query for repository feed"),
            limit: z.number().optional().default(10).describe("Number of items to fetch (default 10)"),
            offset: z.number().optional().default(0).describe("Number of items to skip (default 0)"),
          }),
          execute: async ({ org, repo, query, limit = 10, offset = 0 }) => {
            try {
              const repoId = await getRepoId(org, repo);
              if (!repoId) {
                return {
                  success: false,
                  error: `Repository ${org}/${repo} not found`,
                };
              }

              const result = await fetchFeedPage({
                repoId,
                query,
                limit,
                offset,
              });
              return {
                success: true,
                data: result,
                message: `Found ${result.items.length} items in ${org}/${repo} repository feed${query ? ` for query: "${query}"` : ""}`,
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to fetch repository feed",
              };
            }
          },
        }),
      },
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

Current context: ${context?.feedType || "unknown"} ${context?.org ? `org: ${context.org}` : ""} ${context?.repo ? `repo: ${context.repo}` : ""}

When using tools:
- Use queryFeed for personal feed queries
- Use queryPublicFeed for public feed queries  
- Use queryRepoFeed when context includes org and repo (pass org and repo parameters)
- Always provide helpful explanations of the results
- Format feed items in a readable way with links when possible
- When showing feed items, include relevant details like title, type, updated_at, and repository info

Be concise but helpful. If a query fails, suggest alternative approaches.`,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}