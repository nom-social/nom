import { Octokit } from "@octokit/rest";
import { z } from "zod";

const templateSchema = z.string().max(2_000);
const postCriteriaSchema = z.string().max(4_000);

export async function fetchPostCriteria({
  repo,
  octokit,
}: {
  repo: { org: string; repo: string };
  octokit: Octokit;
}): Promise<string | null> {
  return fetchNomTemplate({
    filename: "post_criteria.txt",
    repo,
    octokit,
    schema: postCriteriaSchema,
  });
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
