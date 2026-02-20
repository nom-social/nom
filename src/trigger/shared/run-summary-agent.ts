import type { ToolSet } from "ai";
import { Output, stepCountIs, ToolLoopAgent } from "ai";

import { createOpenAIProvider } from "@/utils/openai/client";

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
}: RunSummaryAgentParams): Promise<{ summary: string; should_post: boolean }> {
  const agentInstructions = `You summarize GitHub events (pull requests, pushes, releases) and decide whether to post to the feed.

Respond with JSON containing:
- summary: concise 1-3 sentence feed summary
- should_post: boolean indicating whether this update should be posted

---

${instructions}`;

  const agent = new ToolLoopAgent({
    model: createOpenAIProvider().languageModel("gpt-5.2"),
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
