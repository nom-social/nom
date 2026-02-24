import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

/**
 * Shared structured output schema for AI completions that produce both
 * a feed summary and a posting decision (should_post) in a single call.
 */
export const summaryWithPostDecisionSchema = z.object({
  title: z.string().describe("Feed title for the update"),
  summary: z.string().describe("Feed summary for the update"),
  should_post: z
    .boolean()
    .describe("Whether this update should be posted to the feed"),
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
