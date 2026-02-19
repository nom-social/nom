import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

/**
 * Shared structured output schema for AI completions that produce both
 * a feed summary and a posting decision (should_post) in a single call.
 */
export const summaryWithPostDecisionSchema = z.object({
  summary: z.string().describe("Concise feed summary (1-3 sentences)"),
  should_post: z
    .boolean()
    .describe("Whether this update should be posted to the feed"),
  reasoning: z
    .string()
    .optional()
    .describe("Brief rationale for the posting decision"),
});

export type SummaryWithPostDecision = z.infer<
  typeof summaryWithPostDecisionSchema
>;

/**
 * Use with responses.parse() for Responses API (OpenAI's recommended API).
 * Returns text.format derived from the Zod schema.
 */
export const summaryWithPostDecisionTextFormat = zodTextFormat(
  summaryWithPostDecisionSchema,
  "summary_with_post_decision"
);
