import { z } from "zod";

export const PR_ANALYSIS_PROMPT = `Analyze this pull request and provide a JSON response with the following structure:

{
  "summary": "A concise 3-4 sentence summary",
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

Additionally, determine if this pull request needs special attention. A PR needs special attention if ANY of these conditions are met:
- The PR addresses a critical bug (e.g., high-severity, urgent, or production issue)
- The PR requires a database migration
- The PR involves a service migration
- The PR involves downtime or a maintenance window
- The PR includes an update that can affect multiple components or modules

If the PR meets any of these criteria, mention this in your summary. Explain why special attention is needed, citing specific evidence from the PR (such as the description, labels, diff, or special considerations). Be specific about the risks or impacts, and mention any actions reviewers should take or stakeholders to notify.

Keep the analysis concise and actionable. The summary should be clear enough for someone to understand the PR's purpose without reading the full diff.`;

export const prAnalysisResponseSchema = z.object({
  summary: z.string(),
  review_time_minutes: z.number(),
  special_considerations: z.array(z.string()),
  change_type: z.enum(["FEATURE", "BUG_FIX", "TECH_DEBT"]),
  change_type_reason: z.string(),
});

export type PRAnalysisResponse = z.infer<typeof prAnalysisResponseSchema>;
