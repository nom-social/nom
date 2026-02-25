import type { ToolSet } from "ai";
import { Output, stepCountIs, ToolLoopAgent } from "ai";

import { createOpenRouterProvider } from "@/utils/openrouter/client";

import { summaryWithPostDecisionSchema } from "./summary-with-post-decision";

const MAX_STEP_COUNT = 10;

export interface RunSummaryAgentParams {
  instructions: string;
  context: string;
  tools: ToolSet;
}

/**
 * Runs the summary agent with ToolLoopAgent. The model can use tools to explore
 * files and access PRs, then produces a structured summary and posting decision.
 */
export async function runSummaryAgent({
  instructions,
  context,
  tools,
}: RunSummaryAgentParams): Promise<{
  title: string;
  summary: string;
  should_post: boolean;
}> {
  const agentInstructions = `You summarize GitHub events (pull requests, pushes, releases) and decide whether to post to the feed.

Respond with JSON containing:
- title: descriptive sentence summarizing what was done and why
- summary: 2-4 sentence developer-focused explanation of the change and its impact
- should_post: boolean indicating whether this update should be posted

Optionally use find_meme with a query (e.g."developer merge conflict meme", "breaking change meme") to find a relevant meme. If you get verified image URLs, you may append them to the summary as markdown images: ![relevant caption](url). Use at most 1–2 images, and only when they genuinely add humor or clarity.

---

${instructions}`;

  const agent = new ToolLoopAgent({
    model: createOpenRouterProvider().languageModel(
      "google/gemini-3.1-pro-preview"
    ),
    instructions: agentInstructions,
    tools,
    output: Output.object({
      schema: summaryWithPostDecisionSchema,
    }),
    stopWhen: stepCountIs(MAX_STEP_COUNT),
  });

  const result = await agent.generate({ prompt: context });

  if (!result.output) {
    throw new Error("Failed to generate AI response: no structured output");
  }

  return result.output;
}
