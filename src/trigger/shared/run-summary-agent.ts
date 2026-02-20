import { openai } from "@ai-sdk/openai";
import type { ToolSet } from "ai";
import { Output, stepCountIs, ToolLoopAgent } from "ai";

import { summaryWithPostDecisionSchema } from "./summary-with-post-decision";

export interface RunSummaryAgentParams {
  prompt: string;
  postCriteria: string;
  tools: ToolSet;
}

/**
 * Runs the summary agent with ToolLoopAgent. The model can use tools to explore
 * files and access PRs, then produces a structured summary and posting decision.
 */
export async function runSummaryAgent({
  prompt,
  postCriteria,
  tools,
}: RunSummaryAgentParams): Promise<{ summary: string; should_post: boolean }> {
  const instructions = `You summarize GitHub events (pull requests, pushes, releases) and decide whether to post to the feed.

Respond with JSON containing:
- summary: concise 1-3 sentence feed summary
- should_post: boolean indicating whether this update should be posted

Apply these posting criteria:
${postCriteria}`;

  const agent = new ToolLoopAgent({
    model: openai("gpt-5.2"),
    instructions,
    tools,
    output: Output.object({
      schema: summaryWithPostDecisionSchema,
    }),
    stopWhen: stepCountIs(10),
  });

  const result = await agent.generate({ prompt });

  if (!result.output) {
    throw new Error("Failed to generate AI response: no structured output");
  }

  return result.output;
}
