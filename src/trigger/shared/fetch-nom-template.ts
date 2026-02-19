import { Octokit } from "@octokit/rest";
import { z } from "zod";

const templateSchema = z.string().max(2_000);
const postCriteriaSchema = z.string().max(4_000);

export type PostCriteriaEventType =
  | "push"
  | "pull_request"
  | "issue"
  | "issue_comment"
  | "release";

/** Default post criteria used when not defined in the user's .nom repo */
export const DEFAULT_POST_CRITERIA: Record<PostCriteriaEventType, string> = {
  issue: `Only post when the issue is substantial.

Post when:
- Bug reports, feature requests, or substantive discussions
- Issues that affect the project or its users

Do NOT post when:
- Minor questions or housekeeping
- Spam or off-topic content`,
  issue_comment: `Only post when the comment adds meaningful value to the discussion.

Post when:
- Substantive replies, decisions, or technical discussion
- Comments that resolve or progress the issue

Do NOT post when:
- "+1" or simple acknowledgments
- Off-topic or spam comments`,
  pull_request: `Only post when the merged PR has meaningful impact.

Post when:
- PR changes 3+ files or 50+ lines
- Adds features, fixes bugs, or refactors significantly

Do NOT post when:
- Trivial documentation tweaks
- Minor dependency bumps
- Formatting or style-only changes`,
  push: `Only post when the push has meaningful impact.

Post when:
- Changes affect source code (src/, lib/) or add new features
- Documentation updates are substantial

Do NOT post when:
- Dependency version bumps only
- Typo fixes, whitespace, or formatting-only changes
- Merge/squash commits (handled separately)`,
  release: `Post all releases. Releases are always notable.`,
} as const;

export async function fetchPostCriteria({
  repo,
  octokit,
  eventType,
}: {
  repo: { org: string; repo: string };
  octokit: Octokit;
  eventType: PostCriteriaEventType;
}): Promise<string> {
  const fromRepo = await fetchNomTemplate({
    filename: `post_criteria_${eventType}.txt`,
    repo,
    octokit,
    schema: postCriteriaSchema,
  });
  return fromRepo ?? DEFAULT_POST_CRITERIA[eventType];
}

export default async function fetchNomTemplate({
  filename,
  repo,
  octokit,
  schema = templateSchema,
}: {
  filename: string;
  repo: {
    org: string;
    repo: string;
  };
  octokit: Octokit;
  schema?: z.ZodType<string>;
}): Promise<string | null> {
  try {
    const { data } = await octokit.repos.getContent({
      owner: repo.org,
      repo: repo.repo,
      path: `.nom/${filename}`,
    });
    if (Array.isArray(data) || !("content" in data)) return null;
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    const parsed = schema.safeParse(content);
    return parsed.success ? content : null;
  } catch {
    return null;
  }
}
