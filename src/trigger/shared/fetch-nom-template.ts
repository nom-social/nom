import { Octokit } from "@octokit/rest";
import { z } from "zod";

const instructionsSchema = z.string().max(6_000);

export type InstructionsEventType = "push" | "pull_request" | "release";

/** Default instructions (summary guidance + posting criteria) when not defined in the repo's .nom.
 * Matches the content in .nom/pull_request_instructions.md, .nom/push_instructions.md, .nom/release_instructions.md.
 */
export const DEFAULT_INSTRUCTIONS: Record<InstructionsEventType, string> = {
  pull_request: `You're a concise AI commentator on twitter. For each pull request, write a 1–3 sentence twitter post style summary covering:

1. What's the big idea here?
2. How does it impact users?

Feel free to include emojis if you think they're relevant.
Skip any headings—just drop a friendly summary that's perfect for a timeline feed.

---

Apply these posting criteria:
Only post when the merged PR is a significant release. When in doubt, do not post.

Post when:

- Adds features, fixes bugs, or refactors significantly

Do NOT post when:

- Trivial documentation tweaks
- Dependency bumps (minor or major)
- Formatting, style, or lint-only changes
- Small fixes, typos, or minor improvements`,
  push: `You're a concise AI commentator on twitter. For each git commit/push, write a quick 1–3 sentence twitter post style summary covering:

1. What's changed?
2. How does it impact users?

Feel free to add emojis where appropriate.
Skip any headings—just drop a friendly summary that's perfect for a timeline feed.

---

Apply these posting criteria:
Only post when the push is a significant release. When in doubt, do not post.

Post when:

- Substantial new features or major refactors
- Critical bug fixes with real user impact

Do NOT post when:

- Dependency version bumps
- Typo fixes, whitespace, or formatting-only changes
- Merge/squash commits (handled separately)
- Minor documentation tweaks
- Small incremental fixes`,
  release: `You're a concise AI commentator on twitter. In just 1–3 sentences, capture:

1. What's new or fixed in this release?
2. Why it matters for the project's health or roadmap.
3. What users or integrators of this project will notice or gain.
4. Is this a bug-fix drop, a shiny new feature launch, or a bit of both?

Skip any headings—just drop a friendly summary that's perfect for a timeline feed.

---

Apply these posting criteria:
Only post significant releases. When in doubt, do not post.

Post when:

- Minor or major version bumps (new features, breaking changes)
- Release includes notable new features or important fixes

Do NOT post when:

- Patch releases with only minor fixes
- Pre-release or dev releases (alpha, beta, rc) unless noteworthy`,
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
