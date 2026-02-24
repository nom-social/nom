import { Octokit } from "@octokit/rest";
import { z } from "zod";

const instructionsSchema = z.string().max(6_000);

export type InstructionsEventType = "push" | "pull_request" | "release";

/** Default instructions (summary guidance + posting criteria) when not defined in the repo's .nom.
 * Matches the content in .nom/pull_request_instructions.md, .nom/push_instructions.md, .nom/release_instructions.md.
 */
export const DEFAULT_INSTRUCTIONS: Record<InstructionsEventType, string> = {
  pull_request: `You're writing developer-facing updates for a feed. For each pull request, write:

Title: A descriptive sentence summarizing what was done and why (not clickbait, not a headline — more like a commit message with context).

Summary: 2-4 sentences explaining the problem or context, what changed, and the impact. Be technical but approachable. End with a short remark on the practical effect. No headings, no bullet points. Emojis are fine but use sparingly.

---

Apply these posting criteria:
Post updates that a developer following this project would find interesting. Err on the side of sharing.

Post when:

- Adds features, fixes bugs, or refactors
- Interesting experiments, new approaches, or "got X working"
- Incremental progress that feels satisfying

Do NOT post when:

- Trivial documentation tweaks
- Dependency bumps (minor or major)
- Formatting, style, or lint-only changes
- Pure typo fixes with no substance`,
  push: `You're writing developer-facing updates for a feed. For each push, write:

Title: A descriptive sentence summarizing what was done and why (not clickbait, not a headline — more like a commit message with context).

Summary: 2-4 sentences explaining the problem or context, what changed, and the impact. Be technical but approachable. End with a short remark on the practical effect. No headings, no bullet points. Emojis are fine but use sparingly.

---

Apply these posting criteria:
Post updates that a developer following this project would find interesting. Err on the side of sharing.

Post when:

- New features, refactors, or improvements
- Bug fixes that matter
- Interesting experiments or incremental wins worth sharing

Do NOT post when:

- Dependency version bumps
- Typo fixes, whitespace, or formatting-only changes
- Merge/squash commits (handled separately)
- Changes with no real substance`,
  release: `You're writing developer-facing updates for a feed. For each release, write:

Title: A descriptive sentence summarizing what's in this release and why it matters (not clickbait, not a headline — more like a commit message with context).

Summary: 2-4 sentences covering what's new or fixed, why it matters, and what users or integrators will notice. Be technical but approachable. End with a short remark on the practical effect. No headings, no bullet points. Emojis are fine but use sparingly.

---

Apply these posting criteria:
Post releases that a developer following this project would find interesting. Err on the side of sharing.

Post when:

- Version bumps (including minor and patch when there's something to say)
- New features, important fixes, or notable improvements

Do NOT post when:

- Pre-release or dev releases (alpha, beta, rc) unless noteworthy
- Completely empty or placeholder releases`,
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
