import { Octokit } from "@octokit/rest";
import { z } from "zod";

const instructionsSchema = z.string().max(6_000);

export type InstructionsEventType =
  | "push"
  | "pull_request"
  | "issue"
  | "issue_comment"
  | "release";

/** Default instructions (summary guidance + posting criteria) when not defined in the repo's .nom */
export const DEFAULT_INSTRUCTIONS: Record<InstructionsEventType, string> = {
  pull_request: `Please provide a concise summary of this pull request, focusing on:
1. What is this change about?
2. How does it impact the project?
3. What are some concerns about this PR?

Respond in prose, using 1 to 3 sentences. Do not start with a title or mention that this is a pull request summary.

You can use the explore_file tool to read specific file contents, or get_pull_request for full PR details including diff. Only call tools if you need more context.

Keep the summary clear and to the point, so someone can quickly understand the essence, impact, and any potential issues of this PR.

---

Apply these posting criteria:
Only post when the merged PR has meaningful impact.

Post when:
- PR changes 3+ files or 50+ lines
- Adds features, fixes bugs, or refactors significantly

Do NOT post when:
- Trivial documentation tweaks
- Minor dependency bumps
- Formatting or style-only changes`,
  push: `You summarize GitHub push events for a project timeline. Write a concise, friendly summary (1-3 sentences) that covers:
- What was pushed?
- Who contributed?
- Any notable changes or context from the commit messages?

You can use explore_file to read specific file contents, or get_pull_request when a PR number is known from context. Only call tools if you need more context.

Do not include a heading or title. Just write the summary in plain language, clear and helpful for a timeline feed.

---

Apply these posting criteria:
Only post when the push has meaningful impact.

Post when:
- Changes affect source code (src/, lib/) or add new features
- Documentation updates are substantial

Do NOT post when:
- Dependency version bumps only
- Typo fixes, whitespace, or formatting-only changes
- Merge/squash commits (handled separately)`,
  release: `Read this GitHub release and write a friendly, concise summary (1-3 sentences) that captures:
- What changed in this release?
- How does it impact the project?
- How does it affect users or integrators?
- Is this a bug fix, feature release, or both?

You can use explore_file to read files at the release tag, or get_pull_request if you need PR context. Only call tools if you need more context.

Do not include a heading or title in your response. Just write the summary in plain language, clear and helpful for a timeline feed.

---

Apply these posting criteria:
Post all releases. Releases are always notable.`,
  issue: `Read this GitHub issue and its comments, and write a friendly, concise summary (1-3 sentences) that captures the main point, discussion, and any important context.

Focus on:
- What is the issue about?
- How does this issue affect the project?
- Any consensus, solutions, conclusions, or next steps?

Keep it short, clear, and helpful for a timeline feed. Do not include a "Summary" heading or title in your response.

---

Apply these posting criteria:
Only post when the issue is substantial.

Post when:
- Bug reports, feature requests, or substantive discussions
- Issues that affect the project or its users

Do NOT post when:
- Minor questions or housekeeping
- Spam or off-topic content`,
  issue_comment: `Read this GitHub issue and its comments, and write a friendly, concise summary (1-3 sentences) that captures the main point, discussion, and any important context.

Focus on:
- What is the issue about?
- How does this issue affect the project?
- Any consensus, solutions, conclusions, or next steps?

Keep it short, clear, and helpful for a timeline feed. Do not include a "Summary" heading or title in your response.

---

Apply these posting criteria:
Only post when the comment adds meaningful value to the discussion.

Post when:
- Substantive replies, decisions, or technical discussion
- Comments that resolve or progress the issue

Do NOT post when:
- "+1" or simple acknowledgments
- Off-topic or spam comments`,
};

export async function fetchNomInstructions({
  eventType,
  repo,
  octokit,
}: {
  eventType: InstructionsEventType;
  repo: { org: string; repo: string };
  octokit: Octokit;
}): Promise<string> {
  const filename = `${eventType}_instructions.md`;
  try {
    const { data } = await octokit.repos.getContent({
      owner: repo.org,
      repo: repo.repo,
      path: `.nom/${filename}`,
    });
    if (Array.isArray(data) || !("content" in data)) {
      return DEFAULT_INSTRUCTIONS[eventType];
    }
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    const parsed = instructionsSchema.safeParse(content);
    return parsed.success ? content : DEFAULT_INSTRUCTIONS[eventType];
  } catch {
    return DEFAULT_INSTRUCTIONS[eventType];
  }
}
