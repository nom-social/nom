import { z } from "zod";

// TODO: Process the PR diff here to create a summary instead
export const PR_ANALYSIS_PROMPT = `Hey there! 👋 Let's take a look at this pull request and break it down into something easy to digest. Please give me a JSON response like this:

{
  "summary": "A friendly 3-4 sentence overview that gets to the point",
  "review_time_minutes": number,
  "special_considerations": [
    "Heads up! Important stuff we should keep an eye on",
    "Any worries about the author's experience or those pesky checks (only if something's up)",
    "Other things reviewers should know about"
  ],
  "change_type": "FEATURE" | "BUG_FIX" | "TECH_DEBT",
  "change_type_reason": "Quick explanation of why we picked this type"
}

Here's what we're looking at:
Title: {title}
Author: {author}
Author Association: {author_association}
Description: {description}

The numbers:
- Files changed: {changed_files}
- Additions: {additions}
- Deletions: {deletions}
- Labels: {labels}

How are the checks doing?
{checks_status}

The good stuff (the diff):
{pr_diff}

Let's focus on these key points:
1. What's the main idea here? What's changing and why?
2. How long might it take to review this? (Think about the complexity and scope)
3. Any potential gotchas or things to watch out for, like:
   - Anything risky or complex that needs extra attention
   - Any concerns about who wrote it or if the checks are happy (only if relevant)
   - Other important bits reviewers should know about
4. What kind of change is this really? (Feature, bug fix, or tech debt?)

Also, heads up! 🚨 Let me know if this PR needs special attention. That's if ANY of these ring true:
- It's fixing a critical bug (you know, the "oh no!" kind)
- There's database migration magic happening
- We're moving services around
- We need some downtime or maintenance window
- It's touching multiple parts of the codebase

If any of those are true, pop it in the summary! Tell us why we need to pay extra attention, and point to the specific bits in the PR that caught your eye. Let us know what the risks might be and who needs to know about it.

Keep it snappy and to the point - we want someone to get the gist without diving into the whole diff. 😊`;

export const prAnalysisResponseSchema = z.object({
  summary: z.string(),
  review_time_minutes: z.number(),
  special_considerations: z.array(z.string()),
  change_type: z.enum(["FEATURE", "BUG_FIX", "TECH_DEBT"]),
  change_type_reason: z.string(),
});

export type PRAnalysisResponse = z.infer<typeof prAnalysisResponseSchema>;
