import { z } from "zod";

export const PR_ANALYSIS_PROMPT = `Analyze this pull request and provide a JSON response with the following structure:

{
  "summary": "A concise 1-2 sentence description of what the PR does",
  "review_time_minutes": number,
  "special_considerations": [
    "Important factors that need attention, such as significant risks, complex changes, or notable patterns",
    "Any specific concerns about author experience or check status (only if relevant)",
    "Other critical considerations for reviewers"
  ],
  "change_type": "FEATURE" | "BUG_FIX" | "TECH_DEBT",
  "change_type_reason": "Brief explanation of why this classification was chosen"
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

Checks Status:
{checks_status}

Diff:
{pr_diff}

Focus on:
1. Understanding the core changes and their impact
2. Estimating review time based on complexity and scope
3. Identifying any potential risks or special considerations, including:
   - Significant risks or complex changes that need attention
   - Author experience or check status (only if there are specific concerns)
   - Other important factors that reviewers should be aware of
4. Classifying the type of change based on the content

Keep the analysis concise and actionable. The summary should be clear enough for someone to understand the PR's purpose without reading the full diff.`;

export const prAnalysisResponseSchema = z.object({
  summary: z.string(),
  review_time_minutes: z.number(),
  special_considerations: z.array(z.string()),
  change_type: z.enum(["FEATURE", "BUG_FIX", "TECH_DEBT"]),
  change_type_reason: z.string(),
});

export type PRAnalysisResponse = z.infer<typeof prAnalysisResponseSchema>;
