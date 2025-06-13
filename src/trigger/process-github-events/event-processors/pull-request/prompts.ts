import { z } from "zod";

export const PR_ANALYSIS_PROMPT = `Analyze this pull request and provide a JSON response with the following structure:

{
  "summary": "A concise 2-3 sentence description of what the PR does",
  "review_time_minutes": number,
  "special_considerations": string[],
  "change_type": "FEATURE" | "BUG_FIX" | "TECH_DEBT",
  "change_type_reason": "Brief explanation of why this classification was chosen",
  "author_context": {
    "needs_extra_attention": boolean,
    "reason": "Brief explanation if extra attention is needed based on author's association"
  }
}

Pull Request Details:
Title: {title}
Author: {author}
Author Association: {author_association}
Description: {description}

Changes:
- Files changed: {changed_files}
- Additions: {additions}
- Deletions: {deletions}
- Labels: {labels}

Diff:
{pr_diff}

Focus on:
1. Understanding the core changes and their impact
2. Estimating review time based on complexity and scope
3. Identifying any potential risks or special considerations
4. Classifying the type of change based on the content
5. Considering the author's association with the repository when suggesting review approach

Keep the analysis concise and actionable. The summary should be clear enough for someone to understand the PR's purpose without reading the full diff.`;

export const prAnalysisResponseSchema = z.object({
  summary: z.string(),
  review_time_minutes: z.number(),
  special_considerations: z.array(z.string()),
  change_type: z.enum(["FEATURE", "BUG_FIX", "TECH_DEBT"]),
  change_type_reason: z.string(),
  author_context: z.object({
    needs_extra_attention: z.boolean(),
    reason: z.string(),
  }),
});

export type PRAnalysisResponse = z.infer<typeof prAnalysisResponseSchema>;
